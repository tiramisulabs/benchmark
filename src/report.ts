import process from 'node:process';

// What every bot reports, whatever the library or the runtime. The parent
// (bench.js) samples RSS and CPU from /proc on its own; this side adds what
// only the process can see: the JS heap, event loop delay, the gateway
// traffic it handled and how much of it ended up in the cache.

export type CacheCounts = Record<string, number>;

interface Packet {
    op?: number;
    t?: string | null;
    d?: unknown;
}

const WINDOW_MS = 5_000;
const LAG_TICK_MS = 100;
// cache counts walk the collections, so they're taken once a minute
const CACHE_EVERY = 12;

function emit(data: object) {
    process.stdout.write(`@@bench ${JSON.stringify(data)}\n`);
}

export function startReport(counts: () => CacheCounts | Promise<CacheCounts>) {
    let dispatches = 0;
    let windows = 0;
    // ready is the same moment for every library: the GUILD_CREATE of each
    // guild listed in READY has arrived (libraries define "ready" differently)
    let pending: Set<string> | undefined;
    let ready = false;

    // event loop delay, portable across Node and Bun: how late a
    // 100 ms timer fires
    const lags: number[] = [];
    let expected = performance.now() + LAG_TICK_MS;
    setInterval(() => {
        const now = performance.now();
        lags.push(Math.max(0, now - expected));
        expected = now + LAG_TICK_MS;
    }, LAG_TICK_MS);

    setInterval(async () => {
        const memory = process.memoryUsage();
        lags.sort((a, b) => a - b);
        const pick = (q: number) => lags.length ? lags[Math.min(lags.length - 1, Math.floor(lags.length * q))] : 0;
        const line: Record<string, unknown> = {
            t: Date.now(),
            rss: memory.rss,
            heapUsed: memory.heapUsed,
            heapTotal: memory.heapTotal,
            external: memory.external,
            arrayBuffers: memory.arrayBuffers,
            dispatches,
            lagP50: pick(0.5),
            lagP99: pick(0.99),
            lagMax: lags.at(-1) ?? 0
        };
        lags.length = 0;
        dispatches = 0;
        if (++windows % CACHE_EVERY === 0) {
            try {
                line.cache = await counts();
            } catch (error) {
                line.cacheError = String(error);
            }
        }
        emit(line);
    }, WINDOW_MS);

    return {
        packet(packet: Packet) {
            // dispatches only; GUILDS_READY is synthesised by Seyfert, which
            // also renames the GUILD_CREATEs of its startup to RAW_GUILD_CREATE
            if (packet.op !== 0 || !packet.t || packet.t === 'GUILDS_READY') return;
            const event = packet.t.startsWith('RAW_') ? packet.t.slice(4) : packet.t;
            dispatches++;
            if (ready) return;
            if (event === 'READY') {
                const guilds = (packet.d as { guilds: { id: string }[] }).guilds;
                pending = new Set(guilds.map(guild => guild.id));
            } else if (event === 'GUILD_CREATE' && pending) {
                pending.delete((packet.d as { id: string }).id);
            } else {
                return;
            }
            if (pending?.size === 0) {
                ready = true;
                const memory = process.memoryUsage();
                emit({ t: Date.now(), ready: Math.round(process.uptime() * 1e3), heapUsed: memory.heapUsed, rss: memory.rss });
            }
        }
    };
}

/**
 * The one cache limit every library gets: messages kept per channel. It is
 * discord.js' default; messages are the only cache that grows with traffic
 * rather than with the size of the guilds, and nothing else is limited or swept.
 */
export const MESSAGES_PER_CHANNEL = 200;

/** every non-privileged intent, polls and auto moderation included */
export const INTENTS = 53_575_421;

export function token() {
    const value = process.env.TOKEN;
    if (!value) {
        console.error('TOKEN is not set');
        process.exit(1);
    }
    return value;
}
