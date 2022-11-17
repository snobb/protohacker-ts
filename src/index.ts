import { BogusCoinTransform } from './task05/bogus-coin';
import { Chat } from './task03/chat';
import { FixedChunkTransform } from './lib/fixed-chunk-transform';
import { LineTransform } from './lib/line-transform';
import { Price } from './task02a/price';
import { PriceTransform } from './task02b/price';
import { PrimeTransform } from './task01b/prime';
import { Socket } from 'node:net';
import { SpeedDaemon } from './task06/speed-daemon';
import { UnusualDB } from './task04/db';
import { prime } from './task01a/prime';
import { tcpServer } from './lib/tcp-server';
import { udpServer } from './lib/udp-server';

/* eslint-disable no-console */

// make sure it listens on ipv4 address.
const udpPort = parseInt(process.env.UDP_PORT || '5000', 10);
const tcpPort = parseInt(process.env.TCP_PORT || '8080', 10);
const address = process.env.SOCKET_ADDRESS;

// 00. Smoke Test - https://protohackers.com/problem/0
export function task00 () {
    return tcpServer(tcpPort, (conn: Socket) => {
        conn.pipe(conn);
    });
}

// 01. Prime Time - https://protohackers.com/problem/1
export function task01a () {
    return tcpServer(tcpPort, (conn: Socket) => {
        prime(conn);
    });
}

// 01. Prime Time - https://protohackers.com/problem/1
export function task01b () {
    return tcpServer(tcpPort, (conn: Socket) => {
        conn
            .pipe(new LineTransform())
            .pipe(new PrimeTransform())
            .pipe(conn)
            .on('error', console.error);
    });
}

// 02. Means to an End - https://protohackers.com/problem/2
export function task02a () {
    return tcpServer(tcpPort, async (conn: Socket) => {
        const price = new Price();
        await price.handle(conn);
        conn.destroy();
    });
}

// 02. Means to an End (stream based) - https://protohackers.com/problem/2
export function task02b () {
    return tcpServer(tcpPort, (conn: Socket) => {
        // stream based implementation.
        const price = new PriceTransform();
        const fixedChunkStream = new FixedChunkTransform({ size: PriceTransform.msgSize });
        conn
            .pipe(fixedChunkStream)
            .pipe(price)
            .pipe(conn)
            .on('error', console.error);
    });
}

// 03. Budget Chat - https://protohackers.com/problem/3
export function task03 () {
    const chat = new Chat();
    return tcpServer(tcpPort, (conn: Socket) => {
        chat.handle(conn);
    });
}

// 04. Unusual database - https://protohackers.com/problem/4
export function task04 () {
    // comment out the tcp part of the fly.toml and add UDP section like below to make it work.
    //
    // [[services]]
    //   internal_port = 5000
    //   protocol = "udp"
    //
    //   [[services.ports]]
    //     port = 5000
    //
    const db = new UnusualDB();
    return udpServer({ address, port: udpPort }, db.handle.bind(db));
}

// 05. Mob in the Middle - https://protohackers.com/problem/5
export function task05 () {
    return tcpServer(tcpPort, (conn: Socket) => {
        // backend connection
        const be = new Socket();
        be.on('data', (chunk) => {
            console.log('got data: %s', chunk);
        });

        const proxyPort = parseInt(process.env.PROXY_PORT || '8100', 10);
        const proxyAddress = process.env.PROXY_ADDRESS || 'localhost';
        be.connect(proxyPort, proxyAddress);

        conn
            .pipe(new LineTransform())
            .pipe(new BogusCoinTransform())
            .pipe(be)
            .pipe(new LineTransform())
            .pipe(new BogusCoinTransform())
            .pipe(conn)
            .on('error', console.error);
    });
}

// 06. Speed daemon - https://protohackers.com/problem/6
export function task06 () {
    const speed = new SpeedDaemon();
    return tcpServer(tcpPort, (conn: Socket) => speed.handle(conn));
}

task06();
