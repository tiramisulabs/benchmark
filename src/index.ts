import 'dotenv/config';
import { exec } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

const path = process.argv[2];
const intents = [
    513,//guilds and guildMessages
    98045,//all except privileged
];
const numShards = 3;
const end = Date.now() + (60 * 60 * 1e3);
(async () => {
    for (let i of intents) {
        const stream = createWriteStream(join(process.cwd(), 'results', `${path.split('.js')[0]}-${i}.txt`));
        const bot = exec(`node ./dist/${path} ${i}`);

        bot.stdout?.on('data', (data) => {
            if (typeof data === 'string' && data.startsWith('{ heapUsed')) {
                const memoryUsage = JSON.parse(data.replace(/heapUsed|rss|heapTotal/g, val => `"${val}"`));
                const text = `{ heapUsed: ${memoryUsage.heapUsed}, heapTotal: ${memoryUsage.heapTotal}, rss: ${memoryUsage.rss}, now: ${Date.now()} }\n`;
                const date = new Date(end - Date.now());
                console.log(path, { i, heapUsed: formatMemoryUsage(memoryUsage.heapUsed), heapTotal: formatMemoryUsage(memoryUsage.heapTotal), rss: formatMemoryUsage(memoryUsage.rss) }, date.toISOString().substring(14, 19));
                stream.write(text);
            } else console.log(i, data);
        });
        await delay(numShards * 5.5e3);
    }
})();

setTimeout(() => {
    process.exit(1);
}, 60 * 60 * 1e3);

function formatMemoryUsage(data: number) {
    return `${Math.round((data / 1024 / 1024) * 100) / 100} MB`;
}