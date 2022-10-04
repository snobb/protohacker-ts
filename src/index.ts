import { Socket } from 'node:net';
import { tcpServer } from './lib/server';

const port = 8080;

function main () {
    return tcpServer(port, (conn: Socket) => {
        // Smoke Test - https://protohackers.com/problem/0
        conn.pipe(conn);
    });
}

main();
