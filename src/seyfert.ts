import { Client, MemoryAdapter } from 'seyfert';
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
            bans: true,
            channels: true,
            emojis: true,
            guilds: true,
            members: true,
            messages: true,
            overwrites: true,
            presences: true,
            roles: true,
            stageInstances: true,
            stickers: true,
            threads: true,
            users: true,
            voiceStates: true,
            onPacket: true,
        },
        adapter: new MemoryAdapter({
            encode(data) {
                return data;
            },
            decode(data) {
                return data;
            },
        })
    },
});

void client.start({
    connection: {
        intents: Number(intents)
    }
});

setInterval(() => {
    sendMemoryUsage();
    // client.cache.guilds!.valuesRaw();
}, 5e3);

function sendMemoryUsage() {
    const usage = process.memoryUsage();
    console.log({
        heapUsed: usage.heapUsed,
        rss: usage.rss,
        heapTotal: usage.heapTotal
    });
}