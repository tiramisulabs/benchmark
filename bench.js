const { exec } = require('child_process');
const { lstatSync, mkdirSync } = require('fs');
const { join } = require('path');
const { setTimeout: wait } = require('timers/promises');
const { promisify } = require('util');

try {
    lstatSync(join(process.cwd(), 'results'));
} catch {
    mkdirSync(join(process.cwd(), 'results'));
}

try {
    lstatSync(join(process.cwd(), 'results', 'node'));
} catch {
    mkdirSync(join(process.cwd(), 'results', 'node'));
}

try {
    lstatSync(join(process.cwd(), 'results', 'bun'));
} catch {
    mkdirSync(join(process.cwd(), 'results', 'bun'));
}

//ewwwwwww
try {
    lstatSync(join(process.cwd(), 'results', 'deno'));
} catch {
    mkdirSync(join(process.cwd(), 'results', 'deno'));
}

const runtime = process.argv.at(2)

async function main() {
    for (let i of [
        'detritus-client',
        'discord_js',
        'eris',
        'oceanic_js',
        'seyfert',
    ]) {
        console.log(`Starting ${i} process with pm2`);
        switch (runtime) {
            case 'deno':
                await promisify(exec)(`pm2 start --interpreter deno --interpreter-args="run -A" ./dist/index.js --no-autorestart --name ${i}Deno -- ${i}.js`);
                break
            case 'bun':
                await promisify(exec)(`pm2 start --interpreter bun ./dist/index.js --no-autorestart --name ${i}Bun -- ${i}.js`);
                break
            case 'node':
                await promisify(exec)(`pm2 start ./dist/index.js --no-autorestart --name ${i}Node -- ${i}.js`);
                break
            default:
                throw new Error(`Invalid runtime ${runtime}`)
        }
        // 3(shards) * 5(seconds) = 15 + 5(gap)
        await wait(20e3);
    }
}

void main();