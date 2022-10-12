// import { RemoteInfo, Socket as UdpSocket, udpServer } from './lib/udp-server';
import { Chat } from './task03/chat';
import { FixedChunkStream } from './lib/fixed-chunk-stream';
import { Price } from './task02a/price';
import { PriceStream } from './task02b/price';
import { Socket } from 'node:net';
import { prime } from './task01/prime';
import { tcpServer } from './lib/tcp-server';

/* eslint-disable no-console */

const tcpPort = 8080;

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

// 02. Means to an End - https://protohackers.com/problem/2
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

task03();
