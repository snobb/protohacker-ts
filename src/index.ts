import { Socket } from 'node:net';
import { prime } from './prime/prime';
import { tcpServer } from './lib/server';

const port = 8080;

function main () {
    return tcpServer(port, (conn: Socket) => {
        // Smoke Test - https://protohackers.com/problem/0
        // conn.pipe(conn);

        // Prime Time - https://protohackers.com/problem/1
        prime(conn);
    });
}

main();
