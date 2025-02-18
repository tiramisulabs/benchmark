/* eslint-disable no-negated-condition */
import 'dotenv/config';
import { createWriteStream, lstatSync, mkdirSync } from 'node:fs';
import { exec } from 'node:child_process';
import { join } from 'node:path';

try {
    lstatSync(join(process.cwd(), 'results'));
} catch {
    mkdirSync(join(process.cwd(), 'results'));
}

const path = process.argv[2];
const intents = process.argv[3] === 'light'
    ? 513// guilds and guildMessages
    : 98_045;// all except privileged
console.log({
    intents,
    time: process.env.TIME
});
const end = Date.now() + (Number(process.env.TIME) || 12 * (60 * 60 * 1e3));

// @ts-expect-error
const runtime = typeof Bun !== 'undefined'
    ? 'bun'
    // @ts-expect-error
    : typeof Deno !== 'undefined'
        ? 'deno'
        : 'node';

const stream = createWriteStream(join(process.cwd(), 'results', runtime, `${path.split('.js')[0]}-${intents}.txt`));
const bot = exec(`node ./dist/${path} ${intents}`);
stream.write('[\n');
bot.stdout?.on('data', (data) => {
    if (typeof data === 'string' && data.startsWith('{ heapUsed')) {
        const memoryUsage: {
            heapUsed: number;
            heapTotal: number;
            rss: number;
        } = JSON.parse(data.replace(/heapUsed|rss|heapTotal/g, (val) => `"${val}"`));
        const text = `{ "heapUsed": ${memoryUsage.heapUsed}, "heapTotal": ${memoryUsage.heapTotal}, "rss": ${memoryUsage.rss}, "now": ${Date.now()} },\n`;
        const date = new Date(end - Date.now());
        console.log(path, {
            intents,
            heapUsed: formatMemoryUsage(memoryUsage.heapUsed),
            heapTotal: formatMemoryUsage(memoryUsage.heapTotal),
            rss: formatMemoryUsage(memoryUsage.rss)
        }, date.toISOString().substring(11, 19));
        stream.write(text);
    } else {
        console.log(intents, data);
    }
});
bot.stderr?.on('data', console.log);

setTimeout(() => {
    stream.write(']');
    process.exit(0);
}, Number(process.env.TIME) || 12 * (60 * 60 * 1e3));

function formatMemoryUsage(data: number) {
    return `${Math.round(data / 1_024 / 1_024 * 100) / 100} MB`;
}
