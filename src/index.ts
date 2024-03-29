import { AppStream, InsecureDecoderStream } from './task08';
import { FrameReaderStream, FrameWriterStream, LoggerStream, PestControl } from './task11';
import { LRCP, LineReverseStream, Session } from './task07';
import { BogusCoinStream } from './task05/bogus-coin';
import { Chat } from './task03/chat';
import { FixedChunkStream } from './lib/fixed-chunk-stream';
import { JobCentreStream } from './task09/job-centre';
import { LineStream } from './lib/line-stream';
import { Price } from './task02a/price';
import { PriceTransform } from './task02b/price';
import { PrimeStream } from './task01b/prime';
import { Socket } from 'node:net';
import { SpeedDaemon } from './task06/speed-daemon';
import { UnusualDB } from './task04/db';
import { VCS } from './task10/vcs';
import { prime } from './task01a/prime';
import { tcpServer } from './lib/tcp-server';
import { udpServer } from './lib/udp-server';

/* eslint-disable no-console */

// make sure it listens on ipv4 address.
const udpPort = parseInt(process.env.UDP_PORT || '5000', 10);
const tcpPort = parseInt(process.env.TCP_PORT || '8080', 10);
const address = process.env.SOCKET_ADDRESS || '127.0.0.1';

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
            .pipe(new LineStream())
            .pipe(new PrimeStream())
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
        const fixedChunkStream = new FixedChunkStream({ size: PriceTransform.msgSize });
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
            .pipe(new LineStream())
            .pipe(new BogusCoinStream())
            .pipe(be)
            .pipe(new LineStream())
            .pipe(new BogusCoinStream())
            .pipe(conn)
            .on('error', console.error);
    });
}

// 06. Speed daemon - https://protohackers.com/problem/6
export function task06 () {
    const speed = new SpeedDaemon();
    return tcpServer(tcpPort, (conn: Socket) => speed.handle(conn));
}

// 07. Line Reversal  - https://protohackers.com/problem/7
export function task07 () {
    // comment out the tcp part of the fly.toml and add UDP section like below to make it work.
    // [env]
    //   SOCKET_ADDRESS = "fly-global-services"
    //   UDP_PORT = "5000"
    //   DEBUG = 1
    //
    // [[services]]
    //   internal_port = 5000
    //   protocol = "udp"
    //
    //   [[services.ports]]
    //     port = 5000
    //
    const lrcp = new LRCP();

    lrcp.on('session', (session: Session) => {
        session
            .pipe(new LineStream())
            .pipe(new LineReverseStream())
            .pipe(session);
    });

    return udpServer({ address, port: udpPort }, lrcp.handle.bind(lrcp))
        .on('close', () => lrcp.close());
}

// 08. Insecure Sockets Layer - https://protohackers.com/problem/8
export function task08 () {
    return tcpServer(tcpPort, (conn: Socket) => {
        const decoder = new InsecureDecoderStream();

        const log = (...msg: string[]) => {
            console.log(`[${conn.remoteAddress}:${conn.remotePort}]:`, ...msg);
        };

        conn
            .pipe(decoder)
            .on('error', (err: Error) => {
                log(`Decoder error: ${err.message}`);
                conn.destroy();
            })
            .pipe(new LineStream())
            .on('data', (chunk: Buffer) => {
                log(`processing: ${chunk.toString().trim()}`);
            })
            .pipe(new AppStream())
            .on('data', (chunk: Buffer) => {
                log(`result: ${chunk.toString().trim()}`);
                conn.write(decoder.encode(chunk));
            });
    });
}

// 09. Job Centre - https://protohackers.com/problem/9
export function task09 () {
    return tcpServer(tcpPort, (conn: Socket) => {
        const jobcentre = new JobCentreStream(conn);

        conn
            .pipe(new LineStream())
            .pipe(jobcentre)
            .pipe(conn);
    });
}

// 10. Voracious Code Storage - https://protohackers.com/problem/10
export function task10 () {
    const vcs = new VCS();
    return tcpServer(tcpPort, (conn: Socket) => vcs.handleConnection(conn));
}

// 11. Pest Control - https://protohackers.com/problem/11
export function task11 () {
    return tcpServer(tcpPort, (conn: Socket) => {
        const connId = `${conn.remoteAddress}:${conn.remotePort}`;

        conn.setTimeout(30000, () => conn.emit('error', new Error('timeout')));

        conn
            .on('error', (err) => {
                console.log('connection error:', err.message);
                conn.end();
            })
            .pipe(new FrameReaderStream())
            .pipe(new LoggerStream(connId, '>>>'))
            .pipe(new PestControl())
            .pipe(new LoggerStream(connId, '<<<'))
            .pipe(new FrameWriterStream())
            .pipe(conn);
    });
}

task11();
