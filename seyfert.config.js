// @ts-check
import { config } from 'seyfert';

export default config.bot({
    locations: {
        base: 'dist'
    },
    token: process.env.TOKEN ?? ''
});
