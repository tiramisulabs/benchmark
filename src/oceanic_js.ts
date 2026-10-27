import { Client } from 'oceanic.js';
import { INTENTS, MESSAGES_PER_CHANNEL, startReport, token } from './report.js';

const client = new Client({
    auth: `Bot ${token()}`,
    gateway: {
        intents: INTENTS,
        maxShards: 1,
        compress: false,
        largeThreshold: 250
    },
    // the defaults raised to unlimited, except messages: every library keeps
    // the same MESSAGES_PER_CHANNEL
    collectionLimits: {
        messages: MESSAGES_PER_CHANNEL,
        auditLogEntries: Infinity,
        groupChannels: Infinity,
        privateChannels: Infinity
    }
});

const report = startReport(() => {
    let channels = client.privateChannels.size + client.groupChannels.size;
    let members = 0;
    let roles = 0;
    let emojis = 0;
    let voiceStates = 0;
    let messages = 0;
    for (const channel of client.privateChannels.values()) messages += channel.messages.size;
    for (const guild of client.guilds.values()) {
        channels += guild.channels.size + guild.threads.size;
        members += guild.members.size;
        roles += guild.roles.size;
        emojis += guild.emojis.size;
        voiceStates += guild.voiceStates.size;
        for (const channel of [...guild.channels.values(), ...guild.threads.values()]) {
            if ('messages' in channel) messages += channel.messages.size;
        }
    }
    return { guilds: client.guilds.size, channels, users: client.users.size, members, roles, emojis, voiceStates, messages };
});

client.on('packet', packet => report.packet(packet));
client.on('error', error => console.error(error));

void client.connect();
