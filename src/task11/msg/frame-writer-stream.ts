import { Transform, TransformCallback, TransformOptions } from 'node:stream';
import { Payload } from '.';

/* eslint-disable no-console */

const HEADER_SIZE = 5;

export class FrameWriterStream extends Transform {
    constructor (options?: TransformOptions) {
        super({ ...options, writableObjectMode: true });
    }

    _transform (chunk: Payload, _: BufferEncoding, done: TransformCallback) {
        const size = HEADER_SIZE + chunk.payload.length + 1;
        const buf = Buffer.alloc(size);
        const checksum = this.computeChecksum(chunk, size);

        let offset = buf.writeUInt8(chunk.kind);
        offset = buf.writeUInt32BE(size, offset);
        offset += chunk.payload.copy(buf, offset);
        buf.writeUInt8(checksum, offset);
        this.push(buf);

        done();
    }

    computeChecksum (data: Payload, size: number) {
        let sum = data.kind;
        for (let i = 0; i <= 24; i += 8) {
            sum += (size >> i) & 0xff; // eslint-disable-line no-bitwise
        }

        for (const bt of data.payload) {
            sum += bt;
        }

        return 256 - (sum % 256);
    }
}
