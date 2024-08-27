const { exec } = require('child_process');
const { setTimeout: wait } = require('timers/promises');
const { promisify } = require('util');

async function main() {
    for (let i of [
        'detritus-client',
        'discord_js',
        'eris',
        'oceanic_js',
        'seyfert',
    ]) {
        console.log(`Starting ${i} process with pm2`);
        await promisify(exec)(`pm2 start ./dist/index.js --no-autorestart --name ${i} -- ${i}.js`);
        // 3(shards) * 5(seconds) = 15 + 5(gap)
        await wait(20e3);
    }
}

void main();