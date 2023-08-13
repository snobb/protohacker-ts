import { Socket } from 'node:net';

/* eslint-disable no-console */

export type MsgData = {
    time: number
    data: number
}

export type Msg = {
    type: string
    payload: MsgData
};

export class Price {
    static msgSize = 9;
    private pricelog: MsgData[] = [];

    handle (conn: Socket): Promise<void> {
        return new Promise((resolve, reject) => {
            conn
                .on('end', resolve)
                .on('error', reject)
                .on('readable', () => {
                    let chunk: Buffer;
                    while ((chunk = conn.read(Price.msgSize)) !== null) {
                        this.handleMsg(chunk, conn);
                    }
                });
        });
    }

    handleMsg (buf: Buffer, conn: Socket) {
        if (buf?.length !== Price.msgSize) {
            console.error('corrupt buffer:', buf);
            return;
        }

        const msg = this.parseMessage(buf);

        if (msg.type === 'I') {
            console.log('insert:', msg);
            this.pricelog.push(msg.payload);

        } else if (msg.type === 'Q') {
            const mean = this.query(msg.payload.time, msg.payload.data);
            console.log('query:', msg, mean);

            const res = Buffer.alloc(4);
            res.writeInt32BE(mean);
            conn.write(res);

        } else {
            console.error('invalid message:', buf);
        }
    }

    query (lo: number, hi: number) {
        if (lo > hi) {
            return 0;
        }

        const result: number[] = [];

        for (const rec of this.pricelog) {
            if (lo <= rec.time && rec.time <= hi) {
                result.push(rec.data);
            }
        }

        return this.meanNum(result);
    }

    meanNum (data: number[]) {
        if (data.length === 0) {
            return 0;
        }

        let sum = 0;
        for (const val of data) {
            sum += val;
        }

        return Math.floor(sum / data.length);
    }

    parseMessage (buf: Buffer): Msg {
        return {
            // 0x49 (I) or 0x51 (Q)
            type: String.fromCharCode(buf.readUInt8(0)),
            payload: {
                time: buf.readInt32BE(1),
                data: buf.readInt32BE(5),
            }
        };
    }
}
