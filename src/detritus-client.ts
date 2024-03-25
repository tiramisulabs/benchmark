import { ClusterClient } from 'detritus-client';
import 'dotenv/config';

const [, , intents] = process.argv;
console.log('Connecting with', intents);

sendMemoryUsage();

const client = new ClusterClient(
    `${process.env.TOKEN}`,
    {
        gateway: {
            intents: Number(intents),
        },
        shardCount: 3,
    });

client.run();

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