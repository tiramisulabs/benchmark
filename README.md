## Seyfert Benchmark

Memory and CPU of Seyfert, discord.js, Eris, Oceanic and Detritus on Node.js and Bun, all connected to the same bot at the same time so they see the same gateway traffic. Results are published at https://seyfert.dev/benchmark.

### What every bot gets

- One shard and every non-privileged intent (`53575421`), no gateway compression, `large_threshold` 250.
- Every cache on, with one limit shared by all libraries: 200 messages per channel, discord.js' default. Messages are the only cache that grows with traffic instead of with the size of the guilds; nothing else is limited, swept or expired.
- Where a library can't limit per channel it gets the equivalent ceiling: Seyfert limits per guild (200 × the channels of the largest guild) and Detritus globally (200 × its channels), so neither is ever stricter than per channel.

The bots don't register commands or answer anything, so running them with a production token doesn't interfere with the bot that does.

### What is measured

Every 5 seconds:

- From `/proc`, the same way for every runtime: RSS, peak RSS, CPU (user + system) and threads.
- From inside the process: heap used and total, external memory, event loop delay (p50, p99 and max of a 100 ms timer), and the gateway dispatches handled. Once a minute, how many guilds, channels, users, members, roles, emojis, voice states and messages are cached.
- Ready: the moment the `GUILD_CREATE` of every guild in `READY` arrived, measured the same way for all libraries.

`summarize.js` averages each metric per 30 minutes; the headline figure is the median of those averages.

### Running it

Linux only. Each bot runs on the runtime being measured (`node` or `bun`); the orchestrator itself runs on Node.

```sh
bun install
bunx tsc
echo "TOKEN=..." > .env
# pin the bots to the same kind of core on hybrid CPUs
NODE_BIN=$(command -v node) BUN_BIN=$(command -v bun) node bench.js --hours 12 --cpus 0-11
node summarize.js results/<run>
```
