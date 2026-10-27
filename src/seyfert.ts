import { Client, LimitedMemoryAdapter } from 'seyfert';
import { INTENTS, MESSAGES_PER_CHANNEL, startReport, token } from './report.js';

token();

const client = new Client({
    handlePayload: (_shardId, packet) => {
        report.packet(packet);
        // counted from the packets: when GUILDS_READY arrives, the last
        // guild may not be in the cache yet
        if (packet.t === 'RAW_GUILD_CREATE' || packet.t === 'GUILD_CREATE') {
            largestGuild = Math.max(largestGuild, (packet.d as { channels?: unknown[] }).channels?.length ?? 0);
        }
        if (packet.t === 'GUILDS_READY') limitMessages();
    }
});

// Seyfert limits messages per guild, not per channel like the others. Each
// guild gets MESSAGES_PER_CHANNEL for every channel of the largest guild, so
// it's never stricter than per channel; in smaller guilds it can keep more.
// Message storages are created when the first message arrives, after this.
const adapter = new LimitedMemoryAdapter<unknown>();
client.setServices({ cache: { adapter } });
let largestGuild = 1;

function limitMessages() {
    adapter.options.message = { limit: MESSAGES_PER_CHANNEL * largestGuild };
    console.log(`message limit per guild: ${adapter.options.message.limit}`);
}

const report = startReport(() => {
    // one storage per namespace, scoped ones as namespace.scope
    // (member.<guild>, message.<channel>...)
    const counts: Record<string, number> = {};
    for (const [namespace, storage] of adapter.storage) {
        const resource = namespace.split('.')[0];
        counts[resource] = (counts[resource] ?? 0) + storage.size;
    }
    return {
        guilds: counts.guild ?? 0,
        channels: counts.channel ?? 0,
        users: counts.user ?? 0,
        members: counts.member ?? 0,
        roles: counts.role ?? 0,
        emojis: counts.emoji ?? 0,
        voiceStates: counts.voice_state ?? 0,
        messages: counts.message ?? 0
    };
});

void client.start({ connection: { intents: INTENTS } });
