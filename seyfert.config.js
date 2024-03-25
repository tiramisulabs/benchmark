// @ts-check

require('dotenv/config');
const { config } = require('seyfert');

module.exports = config.bot({
    locations: {
        base: 'src',
        output: 'dist',
    },
    intents: [],
    debug: false,
    token: process.env.TOKEN ?? ''
});