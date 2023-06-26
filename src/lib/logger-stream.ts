import { Transform, TransformCallback, TransformOptions } from 'node:stream';
import { log } from '../lib/log';

const maxLen = 50;

// This implementation was inspired by George Borisov's implementation
export class LoggerStream extends Transform {
    constructor (private clientId: string, private pfx: string, opts?: TransformOptions) {
        super({ ...opts });
    }

    _transform (chunk: Buffer, _: BufferEncoding, done: TransformCallback) {
        const chunkStr = (chunk.length > maxLen)
            ? `${chunk.subarray(0, maxLen).toString().trimEnd()}...`
            : chunk.toString().trimEnd();

        log.info(this.clientId, this.pfx, chunkStr);
        this.push(chunk);

        done();
    }
}
