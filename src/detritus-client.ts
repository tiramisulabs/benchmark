import { ShardClient } from 'detritus-client';
import { INTENTS, MESSAGES_PER_CHANNEL, startReport, token } from './report.js';

const client = new ShardClient(token(), {
    gateway: {
        intents: INTENTS,
        compress: false,
        largeThreshold: 250
    },
    // messages expire after 10 minutes by default; no expiry here, so the
    // limit below is the only one, as in every other library
    cache: { messages: { expire: 0 } }
});

const report = startReport(() => ({
    guilds: client.guilds.length,
    channels: client.channels.length,
    users: client.users.length,
    members: client.members.length,
    roles: client.roles.length,
    emojis: client.emojis.length,
    voiceStates: client.voiceStates.length,
    messages: client.messages.length
}));

client.on('raw', packet => report.packet(packet));
// Detritus only limits messages globally: MESSAGES_PER_CHANNEL for every
// channel it knows once the guilds have loaded
client.once('gatewayReady', () => {
    (client.messages as unknown as { limit: number }).limit = MESSAGES_PER_CHANNEL * Math.max(1, client.channels.length);
});

void client.run();
