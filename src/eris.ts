import 'dotenv/config';
import { Client } from 'eris';

const [, , intents] = process.argv;
console.log('Connecting with', intents);

sendMemoryUsage();

const client = new Client(
    `Bot ${process.env.TOKEN}`,
    {
        intents: Number(intents),
        maxShards: 3,
        messageLimit: 0,
    });

client.groupChannels.limit = 0;
client.guilds.limit = 0;
client.privateChannels.limit = 0;
client.relationships.limit = 0;
client.unavailableGuilds.limit = 0;
client.users.limit = 0;
client.relationships.limit = 0;
client.voiceConnections.limit = 0;

// setTimeout(() => {
//     for (let [, guild] of client.guilds) {
//         guild.voiceStates.clear();
//         guild.channels.clear();
//         guild.threads.clear();
//         guild.members.clear();
//         guild.events.clear();
//         guild.stageInstances.clear();
//         guild.roles.clear();

//         guild.voiceStates.limit = 0;
//         guild.channels.limit = 0;
//         guild.threads.limit = 0;
//         guild.members.limit = 0;
//         guild.events.limit = 0;
//         guild.stageInstances.limit = 0;
//         guild.roles.limit = 0;
//     }
// }, 20e3);

void client.connect();

client.on('error', () => {
    //
});

setInterval(() => {
    sendMemoryUsage();
    // [...client.guilds.values()];
}, 5e3);

function sendMemoryUsage() {
    const usage = process.memoryUsage();
    console.log({
        heapUsed: usage.heapUsed,
        rss: usage.rss,
        heapTotal: usage.heapTotal
    });
}