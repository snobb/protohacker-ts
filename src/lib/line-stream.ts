import { Transform, TransformCallback, TransformOptions } from 'node:stream';

export class LineStream extends Transform {
    private chunks: Buffer[];

    constructor (opts?: TransformOptions) {
        super({ ...opts });
        this.chunks = [];
    }

    _transform (chunk: Buffer, _: BufferEncoding, done: TransformCallback) {
        if (chunk.length === 0) {
            return;
        }

        let lo = 0;
        for (let hi = 0; hi < chunk.length; hi += 1) {
            if (chunk[hi] === '\n'.charCodeAt(0)) {
                // include the new line character with every line
                this.chunks.push(chunk.subarray(lo, hi + 1));
                this.push(Buffer.concat(this.chunks));
                this.chunks = [];
                lo = hi + 1;
            }
        }

        if (lo < chunk.length) {
            this.chunks.push(chunk.subarray(lo));
        }

        done();
    }
}
