import 'dotenv/config';
import { Client } from 'oceanic.js';

const [, , intents] = process.argv;
console.log('Connecting with', intents);

sendMemoryUsage();

const token = process.env.TOKEN;
if (!token) {
    console.error('No token provided');
    process.exit(1);
}

const client = new Client({
    auth: `Bot ${token}`,
    disableCache: false,
    gateway: {
        intents: Number(intents),
        firstShardID: 0,
        lastShardID: 32
    },
    collectionLimits: {
        messages: 0,
        auditLogEntries: 0,
        autoModerationRules: 0,
        channels: 0,
        emojis: 0,
        groupChannels: 0,
        // guilds: 0,
        guildThreads: 0,
        integrations: 0,
        invites: 0,
        members: 0,
        privateChannels: 0,
        roles: 0,
        scheduledEvents: 0,
        stageInstances: 0,
        stickers: 0,
        unavailableGuilds: 0,
        users: 0,
        voiceMembers: 0,
        voiceStates: 0
    }
});

void client.connect();

client.on('error', () => {
    //
});

setInterval(() => {
    sendMemoryUsage();
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    [...client.guilds.values()];
}, 5e3);

function sendMemoryUsage() {
    const usage = process.memoryUsage();
    console.log({
        heapUsed: usage.heapUsed,
        rss: usage.rss,
        heapTotal: usage.heapTotal
    });
}
