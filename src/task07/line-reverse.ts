import { Transform, TransformCallback } from 'node:stream';

export class LineReverseStream extends Transform {
    _transform (chunk: Buffer, _: BufferEncoding, done: TransformCallback) {
        const sz = chunk.length - 2;
        for (let hi = sz, lo = 0; lo < (chunk.length - 1) / 2; lo += 1, hi -= 1) {
            [chunk[lo], chunk[hi]] = [chunk[hi], chunk[lo]];
        }

        this.push(chunk);
        done();
    }
}
