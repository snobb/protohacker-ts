import { Chat } from './task03/chat';
import { FixedChunkStream } from './lib/fixed-chunk-stream';
import { Price } from './task02a/price';
import { PriceStream } from './task02b/price';
import { Socket } from 'node:net';
import { UnusualDB } from './task04/db';
import { prime } from './task01/prime';
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
export function task01 () {
    return tcpServer(tcpPort, (conn: Socket) => {
        prime(conn);
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
        const price = new PriceStream();
        const fixedChunkStream = new FixedChunkStream({ size: PriceStream.msgSize });
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

task04();
