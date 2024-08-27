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
        cache: {
            applications: false,
            channels: false,
            connectedAccounts: false,
            emojis: false,
            guilds: false,
            interactions: false,
            members: false,
            messages: false,
            notes: false,
            presences: false,
            relationships: false,
            roles: false,
            sessions: false,
            stageInstances: false,
            stickers: false,
            typings: false,
            users: false,
            voiceCalls: false,
            voiceConnections: false,
            voiceStates: false,
        }
    });

void client.run();

setInterval(() => {
    sendMemoryUsage();
    // for (let [, i] of client.shards) {
    //     i.guilds.toArray();
    // }
}, 5e3);

function sendMemoryUsage() {
    const usage = process.memoryUsage();
    console.log({
        heapUsed: usage.heapUsed,
        rss: usage.rss,
        heapTotal: usage.heapTotal
    });
}