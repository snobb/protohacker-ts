// import { Price } from './price/price';
import { FixedChunkStream } from './lib/fixed-chunk-stream';
import { PriceStream } from './price-stream/price';
// import { Chat } from './chat/chat';
import { Socket } from 'node:net';
// import { prime } from './prime/prime';
import { tcpServer } from './lib/server';

/* eslint-disable no-console */

const port = 8080;

function main () {
    // 03. Budget Chat - https://protohackers.com/problem/3
    // const chat = new Chat();

    return tcpServer(port, (conn: Socket) => {
        // 00. Smoke Test - https://protohackers.com/problem/0
        // conn.pipe(conn);

        // 01. Prime Time - https://protohackers.com/problem/1
        // prime(conn);

        // 02. Means to an End - https://protohackers.com/problem/2
        // const price = new Price();
        // await price.handle(conn);
        // conn.destroy();

        const price = new PriceStream();
        const fixedChunkStream = new FixedChunkStream({ size: PriceStream.msgSize, highWaterMark: 9 });
        conn
            .pipe(fixedChunkStream)
            .pipe(price)
            .pipe(conn)
            .on('error', console.error);
    });
}

main();
