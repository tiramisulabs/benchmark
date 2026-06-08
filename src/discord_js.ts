import { Options, Client } from 'discord.js';
const [, , intents] = process.argv;

console.log('Connecting with', intents);

sendMemoryUsage();

const token = process.env.TOKEN;
if (!token) {
    console.error('No token provided');
    process.exit(1);
}

const client = new Client({
    shardCount: 32,
    intents: Number(intents),
    makeCache: Options.cacheWithLimits({
        ApplicationCommandManager: 0,
        AutoModerationRuleManager: 0,
        BaseGuildEmojiManager: 0,
        DMMessageManager: 0,
        GuildBanManager: 0,
        GuildEmojiManager: 0,
        GuildForumThreadManager: 0,
        GuildInviteManager: 0,
        GuildMemberManager: 0,
        GuildMessageManager: 0,
        GuildScheduledEventManager: 0,
        GuildStickerManager: 0,
        GuildTextThreadManager: 0,
        MessageManager: 0,
        PresenceManager: 0,
        ReactionManager: 0,
        ReactionUserManager: 0,
        StageInstanceManager: 0,
        ThreadManager: 0,
        ThreadMemberManager: 0,
        UserManager: 0,
        VoiceStateManager: 0,
        ApplicationEmojiManager: 0,
        EntitlementManager: 0
        // cannot disable guilds, roles, and channels cache
    })
});

void client.login(token);

setInterval(() => {
    sendMemoryUsage();
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    [...client.guilds.cache.values()];
}, 5e3);

function sendMemoryUsage() {
    const usage = process.memoryUsage();
    console.log({
        heapUsed: usage.heapUsed,
        rss: usage.rss,
        heapTotal: usage.heapTotal
    });
}
