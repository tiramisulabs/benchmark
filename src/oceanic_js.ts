import 'dotenv/config';
import { Client } from 'oceanic.js';

const [, , intents] = process.argv;
console.log('Connecting with', intents);

sendMemoryUsage();

const bot = new Client({
    auth: `Bot ${process.env.TOKEN}`,
    disableCache: false,
    gateway: { intents: Number(intents) }
});

bot.connect();

setInterval(() => {
    sendMemoryUsage();
}, 5e3);

function sendMemoryUsage() {
    const usage = process.memoryUsage();
    console.log({
        heapUsed: usage.heapUsed,
        rss: usage.rss,
        heapTotal: usage.heapTotal
    });
}