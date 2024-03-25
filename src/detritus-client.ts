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

setTimeout(() => {
    console.log({
        members: client.shards.reduce((acc, val) => acc + val.members.size, 0),
        guilds: client.shards.reduce((acc, val) => acc + val.guilds.size, 0),
        users: client.shards.reduce((acc, val) => acc + val.users.size, 0),
        channels: client.shards.reduce((acc, val) => acc + val.channels.size, 0)
    });
}, 20e3);