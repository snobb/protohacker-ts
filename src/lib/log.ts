/* eslint-disable no-console */

export const log = {
    info (...msg: unknown[]) {
        console.log('INFO:', ...msg);
    },

    error (...msg: unknown[]) {
        console.log('ERROR:', ...msg);
    },

    debug (...msg: unknown[]) {
        if (process.env.DEBUG) {
            console.log('DEBUG:', ...msg);
        }
    }
};
