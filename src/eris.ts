import { Client } from 'eris';
import { INTENTS, MESSAGES_PER_CHANNEL, startReport, token } from './report.js';

const client = new Client(`Bot ${token()}`, {
    intents: INTENTS,
    maxShards: 1,
    messageLimit: MESSAGES_PER_CHANNEL,
    compress: false,
    largeThreshold: 250
});

const report = startReport(() => {
    let channels = client.dmChannels.size;
    let members = 0;
    let roles = 0;
    let emojis = 0;
    let voiceStates = 0;
    let messages = 0;
    for (const channel of client.dmChannels.values()) messages += channel.messages.size;
    for (const guild of client.guilds.values()) {
        channels += guild.channels.size + guild.threads.size;
        members += guild.members.size;
        roles += guild.roles.size;
        emojis += guild.emojis.length;
        voiceStates += guild.voiceStates.size;
        for (const channel of [...guild.channels.values(), ...guild.threads.values()]) {
            if ('messages' in channel) messages += channel.messages.size;
        }
    }
    return { guilds: client.guilds.size, channels, users: client.users.size, members, roles, emojis, voiceStates, messages };
});

client.on('rawWS', packet => report.packet(packet));
client.on('error', error => console.error(error));

void client.connect();
