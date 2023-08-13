import { Transform, TransformCallback } from 'node:stream';

/* eslint-disable no-console */

export type MsgData = {
    time: number
    data: number
}

export type Msg = {
    type: string
    payload: MsgData
};

export class PriceTransform extends Transform {
    static msgSize = 9;
    private pricelog: MsgData[] = [];

    _transform (chunk: Buffer, _: BufferEncoding, done: TransformCallback) {
        this.handleMsg(chunk, this.push.bind(this));
        done();
    }

    handleMsg (buf: Buffer, cb: (buf: Buffer)=> void) {
        if (buf.length !== PriceTransform.msgSize) {
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
            cb(res);

        } else {
            console.error('invalid message type:', buf);
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

        let mean = 0;
        let idx = 1;
        for (const val of data) {
            mean += (val - mean) / idx;
            idx += 1;
        }

        return Math.floor(mean);
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
