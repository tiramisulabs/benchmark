// @ts-check

import 'dotenv/config';
import { config } from 'seyfert';

export default config.bot({
    locations: {
        base: 'dist',
    },
    token: process.env.TOKEN ?? ''
});