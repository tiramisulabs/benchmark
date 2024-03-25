import { Client } from 'seyfert';

const [, , intents] = process.argv;
console.log('Connecting with', intents);

sendMemoryUsage();

const client = new Client();

client.start({
    connection: {
        intents: Number(intents)
    }
});

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