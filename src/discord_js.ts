import { ShardingManager } from 'discord.js';
import 'dotenv/config';
import { join } from 'path';

const [, , intents] = process.argv;
console.log('Connecting with', intents);


const promises: { promise: Promise<NodeJS.MemoryUsage>; resolve: (data: any) => any }[] = [];

const manager = new ShardingManager(join(process.cwd(), 'dist', '_', `discord_js_shard${intents}.js`), {
    mode: 'process',
    token: process.env.TOKEN,
    totalShards: 3
});

manager.spawn()
    .then((workers) => {
        for (let i of workers.values()) {
            i.on('message', (message) => {
                promises.shift()!.resolve(message);
            });
        }
        sendMemoryUsage();
        setInterval(() => {
            sendMemoryUsage();
        }, 5e3);
    });

async function sendMemoryUsage() {
    for (let _ of manager.shards) {
        let resolve = (_: any): void => {
            throw new Error('Unexpected');
        };
        const promise = new Promise<any>(res => {
            resolve = res;
        });
        promises
            .push({
                promise,
                resolve
            });
    }
    for (let [_, value] of manager.shards) {
        value.process!.send('');
    }
    await Promise.all(promises.map(x => x.promise))
        .then((results: NodeJS.MemoryUsage[]) => {
            console.log({
                heapUsed: results.reduce((acc, val) => val.heapUsed + acc, 0),
                rss: results.reduce((acc, val) => val.rss + acc, 0),
                heapTotal: results.reduce((acc, val) => val.heapTotal + acc, 0)
            });
        });
}