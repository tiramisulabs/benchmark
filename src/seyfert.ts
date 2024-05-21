import { Client } from 'seyfert';

const [, , intents] = process.argv;
console.log('Connecting with', intents);

sendMemoryUsage();

const client = new Client();

client.start({
    connection: {
        intents: Number(intents)
    }
}).then(() => {
    client.setServices({
        cache: {
            disabledCache: [
                'messages'
            ]
        },
    })
})

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
        members: client.cache.members?.count('*'),
        guilds: client.cache.guilds?.count(),
        users: client.cache.users?.count(),
        channels: client.cache.channels?.count('*')
    });
}, 20e3);