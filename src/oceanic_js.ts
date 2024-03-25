import 'dotenv/config';
import { Client } from 'oceanic.js';

const [, , intents] = process.argv;
console.log('Connecting with', intents);

sendMemoryUsage();

const client = new Client({
    auth: `Bot ${process.env.TOKEN}`,
    disableCache: false,
    gateway: { intents: Number(intents) }
});

client.connect();

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
        members: client.guilds.map(x => x.members.size).reduce((acc, val) => acc + val, 0),
        guilds: client.guilds.size,
        users: client.users.size,
        channels: client.guilds.map(x => x.channels.size).reduce((acc, val) => acc + val, 0)
    });
}, 20e3);