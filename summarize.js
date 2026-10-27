// Turns a results directory from bench.js into 30-minute series and one
// summary per runtime and library.
//
//   node summarize.js results/<run>
//
// Writes <run>/summary.json, <run>/web/<runtime>/<lib>.json (the series the
// site charts, in decimal MB) and prints a table. The headline figure for each
// metric is the median of the 30-minute averages.

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const dir = process.argv[2];
if (!dir || !existsSync(join(dir, 'meta.json'))) throw new Error('usage: node summarize.js results/<run>');

const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
const BUCKET_MS = 30 * 60_000;
const mb = bytes => bytes / 1e6;
const round = (value, digits = 1) => value === null || Number.isNaN(value) ? null : Math.round(value * 10 ** digits) / 10 ** digits;
const average = values => values.length ? values.reduce((total, value) => total + value, 0) / values.length : null;
const median = values => {
    const sorted = values.filter(value => value !== null).sort((a, b) => a - b);
    if (!sorted.length) return null;
    const middle = sorted.length / 2;
    return (sorted[Math.floor(middle)] + sorted[Math.ceil(middle) - 1]) / 2;
};

const summary = {};
for (const { runtime, lib } of meta.jobs) {
    const file = join(dir, runtime, `${lib}.ndjson`);
    if (!existsSync(file)) continue;
    const lines = readFileSync(file, 'utf8').split('\n').filter(Boolean).map(line => JSON.parse(line));
    const start = lines.find(line => line.kind === 'start')?.t;
    const buckets = new Map();
    const bucket = t => {
        const index = Math.floor((t - start) / BUCKET_MS);
        if (!buckets.has(index)) buckets.set(index, { rss: [], cpu: [], heapUsed: [], heapTotal: [], external: [], lagP99: [], dispatches: 0 });
        return buckets.get(index);
    };
    let peakKb = 0;
    let ready = null;
    let cache = null;
    let dispatches = 0;
    let exit = null;
    for (const line of lines) {
        if (line.kind === 'proc') {
            const b = bucket(line.t);
            b.rss.push(mb(line.rssKb * 1024));
            if (line.cpu !== null) b.cpu.push(line.cpu);
            peakKb = Math.max(peakKb, line.hwmKb);
        } else if (line.kind === 'app' && line.ready !== undefined) {
            ready = line.ready;
        } else if (line.kind === 'app') {
            const b = bucket(line.t);
            b.heapUsed.push(mb(line.heapUsed));
            b.heapTotal.push(mb(line.heapTotal));
            b.external.push(mb(line.external));
            b.lagP99.push(line.lagP99);
            b.dispatches += line.dispatches;
            dispatches += line.dispatches;
            if (line.cache) cache = line.cache;
        } else if (line.kind === 'exit') {
            exit = { code: line.code, signal: line.signal, early: line.early, afterHours: round((line.t - start) / 3_600_000, 2) };
        }
    }
    // only whole buckets: the last one is cut short when the run stops
    const series = [...buckets.entries()].sort(([a], [b]) => a - b).filter(([index]) => (index + 1) * BUCKET_MS <= meta.hours * 3_600_000).map(([, b]) => ({
        rss: round(average(b.rss)),
        cpu: round(average(b.cpu), 2),
        heapUsed: round(average(b.heapUsed)),
        heapTotal: round(average(b.heapTotal)),
        external: round(average(b.external)),
        lagP99: round(average(b.lagP99), 2),
        dispatchesPerMinute: round(b.dispatches / 30)
    }));
    const pick = key => series.map(point => point[key]);
    summary[runtime] ??= {};
    summary[runtime][lib] = {
        rss: round(median(pick('rss'))),
        peakRss: round(mb(peakKb * 1024)),
        cpu: round(median(pick('cpu')), 2),
        heapUsed: round(median(pick('heapUsed'))),
        heapTotal: round(median(pick('heapTotal'))),
        external: round(median(pick('external'))),
        lagP99: round(median(pick('lagP99')), 2),
        readyMs: ready,
        dispatches,
        cache,
        exit,
        series
    };
    const web = join(dir, 'web', runtime);
    mkdirSync(web, { recursive: true });
    writeFileSync(join(web, `${lib}.json`), JSON.stringify({ rss: pick('rss'), heapUsed: pick('heapUsed'), heapTotal: pick('heapTotal'), cpu: pick('cpu') }, null, 2));
}

writeFileSync(join(dir, 'summary.json'), JSON.stringify({ meta, summary }, null, 4));

for (const [runtime, libs] of Object.entries(summary)) {
    console.log(`\n${runtime} (${meta.runtimes[runtime]})`);
    console.table(Object.fromEntries(Object.entries(libs).map(([lib, s]) => [lib, {
        'RSS MB': s.rss,
        'peak MB': s.peakRss,
        'CPU %': s.cpu,
        'heap MB': s.heapUsed,
        'lag p99 ms': s.lagP99,
        'ready ms': s.readyMs,
        events: s.dispatches,
        messages: s.cache?.messages,
        users: s.cache?.users,
        exit: s.exit?.early ? `early ${s.exit.code ?? s.exit.signal}` : 'ok'
    }])));
}
