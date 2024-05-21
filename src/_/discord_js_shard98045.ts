import { Client, Options } from 'discord.js';

const client = new Client({
    intents: 98045,
    makeCache: Options.cacheWithLimits({
        MessageManager: 0,//??????!!?!?!?!
        GuildMessageManager: 0//????????????????????????
    })
});

client.login();

process!.on('message', (message) => {
    if (message == '') process.send!(sendMemoryUsage());
});

function sendMemoryUsage() {
    const usage = process.memoryUsage();
    return {
        heapUsed: usage.heapUsed,
        rss: usage.rss,
        heapTotal: usage.heapTotal
    };
}