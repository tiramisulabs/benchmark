import { Client } from 'discord.js';

const client = new Client({
    intents: 513
});

client.login();

process!.on('message', (message) => {
    if (message == '') process.send!(sendMemoryUsage());
});

function sendMemoryUsage() {
    const usage = process.memoryUsage();
    return {
        heapUsed: usage.heapUsed,
        rss: usage.rss,
        heapTotal: usage.heapTotal
    };
}