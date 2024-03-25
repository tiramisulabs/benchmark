import 'dotenv/config';
import { Client } from 'eris';

const [, , intents] = process.argv;
console.log('Connecting with', intents);

sendMemoryUsage();

const bot = new Client(
    `Bot ${process.env.TOKEN}`,
    {
        intents: Number(intents),
        maxShards: 3
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