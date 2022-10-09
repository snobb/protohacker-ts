import { Price } from './price/price';
import { Socket } from 'node:net';
// import { prime } from './prime/prime';
import { tcpServer } from './lib/server';

/* eslint-disable no-console */

const port = 8080;

function main () {
    return tcpServer(port, async (conn: Socket) => {
        // Smoke Test - https://protohackers.com/problem/0
        // conn.pipe(conn);

        // Prime Time - https://protohackers.com/problem/1
        // prime(conn);

        // Means to an End - https://protohackers.com/problem/2
        const price = new Price();
        await price.handle(conn);
        conn.destroy();
    });
}

main();
