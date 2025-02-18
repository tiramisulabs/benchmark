import { MemoryAdapter, Client } from 'seyfert';
const [, , intents] = process.argv;

console.log('Connecting with', intents);

sendMemoryUsage();

const client = new Client({
    shards: {
        start: 0,
        end: 3
    }
});

client.setServices({
    cache: {
        disabledCache: {
            channels: true,
            overwrites: true,
            bans: true,
            emojis: true,
            members: true,
            messages: true,
            presences: true,
            roles: true,
            stageInstances: true,
            stickers: true,
            users: true,
            voiceStates: true,
            // enabled
            onPacket: false,
            guilds: false
        },
        adapter: new MemoryAdapter()
    }
});

void client.start({
    connection: {
        intents: Number(intents)
    }
});

setInterval(() => {
    sendMemoryUsage();
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    [...client.cache.guilds!.valuesRaw()];
}, 5e3);

function sendMemoryUsage() {
    const usage = process.memoryUsage();
    console.log({
        heapUsed: usage.heapUsed,
        rss: usage.rss,
        heapTotal: usage.heapTotal
    });
}
