// Runs every library on Node.js and Bun at the same time, against the same
// bot, so they all see the same gateway traffic. Each bot is started with
// the runtime being measured (node or bun) and sampled from /proc by
// this process, which runs on Node: RSS, peak RSS, CPU and threads, the same
// way for every runtime. The bots add their own heap, event loop and cache
// figures on stdout (src/report.ts).
//
//   node bench.js [--hours 12] [--runtimes node,bun] [--libs seyfert,...]
//
// TOKEN comes from the environment or a .env file. Linux only (/proc).

import { execFileSync, spawn } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { setTimeout as wait } from 'node:timers/promises';
import { parseArgs } from 'node:util';

const { values: args } = parseArgs({
    options: {
        hours: { type: 'string', default: '12' },
        runtimes: { type: 'string', default: 'node,bun' },
        libs: { type: 'string', default: 'seyfert,discord_js,eris,oceanic_js,detritus-client' },
        interval: { type: 'string', default: '5' },
        // one identify per 5 s for a bot with max_concurrency 1
        stagger: { type: 'string', default: '6' },
        // the cores every bot is pinned to (taskset), so none of them lands
        // on a slower core than another; empty to disable
        cpus: { type: 'string', default: '' },
        out: { type: 'string' }
    }
});

if (existsSync('.env')) process.loadEnvFile('.env');
if (!process.env.TOKEN) throw new Error('TOKEN is not set');

const durationMs = Number(args.hours) * 3_600_000;
const intervalMs = Number(args.interval) * 1e3;
const staggerMs = Number(args.stagger) * 1e3;
const runtimes = args.runtimes.split(',');
const libs = args.libs.split(',');
const ticksPerSecond = Number(execFileSync('getconf', ['CLK_TCK']).toString());
const outDir = args.out ?? join('results', new Date().toISOString().replace(/[:.]/g, '-'));

const RUNTIMES = {
    node: { bin: process.env.NODE_BIN ?? 'node', args: [], version: ['-v'] },
    bun: { bin: process.env.BUN_BIN ?? 'bun', args: [], version: ['-v'] }
};

const PACKAGES = { seyfert: 'seyfert', discord_js: 'discord.js', eris: 'eris', oceanic_js: 'oceanic.js', 'detritus-client': 'detritus-client' };

mkdirSync(outDir, { recursive: true });

function procStat(pid) {
    // fields after the command name, which can contain spaces
    const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
    const fields = stat.slice(stat.lastIndexOf(')') + 2).split(' ');
    const status = readFileSync(`/proc/${pid}/status`, 'utf8');
    const kb = name => Number(status.match(new RegExp(`^${name}:\\s+(\\d+)`, 'm'))?.[1] ?? 0);
    return {
        // utime + stime, in clock ticks
        cpuTicks: Number(fields[11]) + Number(fields[12]),
        rssKb: kb('VmRSS'),
        hwmKb: kb('VmHWM'),
        threads: kb('Threads')
    };
}

async function run(runtime, lib, startDelay) {
    await wait(startDelay);
    const dir = join(outDir, runtime);
    mkdirSync(dir, { recursive: true });
    const samples = createWriteStream(join(dir, `${lib}.ndjson`));
    const log = createWriteStream(join(dir, `${lib}.log`));
    const { bin, args: runtimeArgs } = RUNTIMES[runtime];
    const command = [bin, ...runtimeArgs, `dist/${lib}.js`];
    const [file, ...argv] = args.cpus ? ['taskset', '-c', args.cpus, ...command] : command;
    const child = spawn(file, argv, { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    const started = Date.now();
    const write = line => samples.write(`${JSON.stringify(line)}\n`);
    write({ t: started, kind: 'start', runtime, lib, command: command.join(' ') });

    // libraries print the token in some errors (Detritus puts it in a header
    // validation message): it never reaches the logs. Both streams are split
    // into whole lines first, so a token can't straddle two chunks.
    const redact = text => text.replaceAll(process.env.TOKEN, '<token>');
    const lines = (stream, onLine) => {
        let buffered = '';
        stream.on('data', chunk => {
            buffered += chunk;
            let index;
            while ((index = buffered.indexOf('\n')) !== -1) {
                onLine(buffered.slice(0, index));
                buffered = buffered.slice(index + 1);
            }
        });
        stream.on('end', () => buffered && onLine(buffered));
    };
    lines(child.stdout, line => {
        if (line.startsWith('@@bench ')) write({ kind: 'app', ...JSON.parse(line.slice(8)) });
        else log.write(`${redact(line)}\n`);
    });
    lines(child.stderr, line => log.write(`${redact(line)}\n`));

    // taskset execs the runtime, so the pid is the bot itself
    let last;
    const sampler = setInterval(() => {
        try {
            const now = Date.now();
            const stat = procStat(child.pid);
            const cpu = last ? ((stat.cpuTicks - last.cpuTicks) / ticksPerSecond) / ((now - last.t) / 1e3) * 100 : null;
            last = { t: now, cpuTicks: stat.cpuTicks };
            write({ t: now, kind: 'proc', rssKb: stat.rssKb, hwmKb: stat.hwmKb, threads: stat.threads, cpu });
        } catch {
            // the process is gone; its exit is recorded below
        }
    }, intervalMs);

    const exited = new Promise(resolve => child.once('exit', (code, signal) => {
        clearInterval(sampler);
        write({ t: Date.now(), kind: 'exit', code, signal, early: Date.now() - started < durationMs });
        resolve();
    }));
    const timer = setTimeout(() => {
        child.kill('SIGTERM');
        setTimeout(() => child.kill('SIGKILL'), 10_000).unref();
    }, durationMs);
    await exited;
    clearTimeout(timer);
    await new Promise(resolve => samples.end(resolve));
    log.end();
}

function version(runtime) {
    const { bin, version: flag } = RUNTIMES[runtime];
    return execFileSync(bin, flag).toString().trim().split('\n')[0];
}

const jobs = runtimes.flatMap(runtime => libs.map(lib => ({ runtime, lib })));
writeFileSync(join(outDir, 'meta.json'), JSON.stringify({
    started: new Date().toISOString(),
    hours: Number(args.hours),
    intervalSeconds: Number(args.interval),
    cpus: args.cpus || null,
    host: { cpu: os.cpus()[0]?.model, cores: os.cpus().length, memoryGb: Math.round(os.totalmem() / 1e9), kernel: os.release() },
    runtimes: Object.fromEntries(runtimes.map(runtime => [runtime, version(runtime)])),
    libraries: Object.fromEntries(libs.map(lib => [lib, JSON.parse(readFileSync(`node_modules/${PACKAGES[lib]}/package.json`, 'utf8')).version])),
    jobs
}, null, 4));

console.log(`${jobs.length} bots for ${args.hours} h, results in ${outDir}`);
await Promise.all(jobs.map((job, index) => run(job.runtime, job.lib, index * staggerMs)));
const meta = JSON.parse(readFileSync(join(outDir, 'meta.json'), 'utf8'));
writeFileSync(join(outDir, 'meta.json'), JSON.stringify({ ...meta, finished: new Date().toISOString() }, null, 4));
console.log('done');
