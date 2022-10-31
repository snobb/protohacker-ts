import { Transform, TransformCallback, TransformOptions } from 'node:stream';

/* eslint-disable no-console */

export class FixedChunkTransform extends Transform {
    private need: number;
    private shards: Buffer[] = [];
    chunkSize: number;

    constructor (options: TransformOptions & { size: number }) {
        super(options);
        this.need = options.size;
        this.chunkSize = options.size;
    }

    _transform (chunk: Buffer, _: BufferEncoding, done: TransformCallback) {
        let lo = 0;
        let hi: number;

        for (hi = 0; hi < chunk.length; hi += 1, this.need -= 1) {
            if (this.need > 0) {
                continue;
            }

            this.shards.push((<Buffer>chunk).subarray(lo, hi));
            this.push(Buffer.concat(this.shards));

            lo = hi;
            this.shards = [];
            this.need = this.chunkSize;
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
            this.need = this.chunkSize;
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

export async function *fixedChunks (input: NodeJS.ReadableStream, size: number) {
    let need = size;
    let shards: Buffer[] = [];

    for await (const chunk of input) {
        let lo = 0;

        for (let hi = 0; hi < chunk.length; hi += 1, need -= 1) {
            if (need > 0) {
                continue;
            }

            shards.push((<Buffer>chunk).subarray(lo, hi));
            lo = hi;

            yield Buffer.concat(shards);

            shards = [];
            need = size;
        }

        if (lo < chunk.length) {
            shards.push((<Buffer>chunk).subarray(lo));
        }
    }

    if (shards.length > 0) {
        yield Buffer.concat(shards);
    }
}
