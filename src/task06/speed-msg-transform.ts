import { Transform, TransformCallback } from 'node:stream';
import {
    TypeIAMCamera,
    TypeIAMDispatcher,
    TypePlate,
    TypeWantHeartbeat,
    formatError,
} from './msg';

export class SpeedMessageTransform extends Transform {
    private need = -1;
    private shards: Buffer[] = [];
    private currentType = -1;

    _transform (chunk: Buffer, _: BufferEncoding, done: TransformCallback) {
        let lo = 0;
        let hi: number;

        for (hi = 0; hi < chunk.length; hi += 1, this.need -= 1) {
            if (this.currentType === -1) {
                this.currentType = chunk[hi];
                if (this.currentType !== TypeWantHeartbeat && this.currentType !== TypePlate &&
                    this.currentType !== TypeIAMCamera && this.currentType !== TypeIAMDispatcher) {
                    this.push(formatError(`Invalid message type: ${this.currentType}`));
                    return;
                }

                // for messages we know the size for - set the size
                if (this.currentType === TypeWantHeartbeat) {
                    this.need = 5; // type + uint32
                } else if (this.currentType === TypeIAMCamera) {
                    this.need = 7; // type + (3 * uint16)
                }

                continue;
            }

            if (this.need < 0) {
                // not counting type here since it's second pass by now and 'hi' has already been
                // incremented once.
                if (this.currentType === TypePlate) {
                    this.need = 1 + chunk[hi] + 4; // len + string + uint32
                } else if (this.currentType === TypeIAMDispatcher) {
                    this.need = 1 + (chunk[hi] * 2); // len + uint16[len]
                }

                continue;
            }

            if (this.need > 0) {
                continue; // find the end of the needed buffer.
            }

            this.shards.push((<Buffer>chunk).subarray(lo, hi));
            this.push(Buffer.concat(this.shards));

            lo = hi;
            this.shards = [];
            this.currentType = -1;
            this.need = -1;

            hi -= 1; // adjusting counter
        }

        if (lo < hi) {
            this.shards.push((<Buffer>chunk).subarray(lo));
        }

        // handle the cases of small chunks. Eg. when input is spoonfed byte by byte.
        // In this case it will break out of the loop above every time and need to handle the
        // logic outside of the loop.
        if (this.need === 0) {
            this.push(Buffer.concat(this.shards));
            this.shards = [];

            this.currentType = -1;
            this.need = -1;
        }

        done();
    }

    _flush (done: TransformCallback) {
        if (this.shards.length > 0) {
            const buf = Buffer.concat(this.shards);
            this.push(buf);
        }

        done();
    }
}
