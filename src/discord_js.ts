import { Client, Options } from 'discord.js';
import { INTENTS, MESSAGES_PER_CHANNEL, startReport, token } from './report.js';

const client = new Client({
    intents: INTENTS,
    shards: [0],
    shardCount: 1,
    // the default limits, minus the thread sweeper: every library keeps the
    // same MESSAGES_PER_CHANNEL and nothing else is limited or swept
    makeCache: Options.cacheWithLimits({ MessageManager: MESSAGES_PER_CHANNEL }),
    sweepers: {},
    // Discord's default, which the other libraries send; discord.js sends 50
    ws: { large_threshold: 250 }
});

const report = startReport(() => {
    let members = 0;
    let roles = 0;
    let emojis = 0;
    let voiceStates = 0;
    let messages = 0;
    for (const guild of client.guilds.cache.values()) {
        members += guild.members.cache.size;
        roles += guild.roles.cache.size;
        emojis += guild.emojis.cache.size;
        voiceStates += guild.voiceStates.cache.size;
    }
    for (const channel of client.channels.cache.values()) {
        if ('messages' in channel) messages += channel.messages.cache.size;
    }
    return {
        guilds: client.guilds.cache.size,
        channels: client.channels.cache.size,
        users: client.users.cache.size,
        members,
        roles,
        emojis,
        voiceStates,
        messages
    };
});

client.on('raw', packet => report.packet(packet));
client.on('error', error => console.error(error));

void client.login(token());
