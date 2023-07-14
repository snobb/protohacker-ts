import { HEADER_SIZE, msgType } from '.';
import { Transform, TransformCallback, TransformOptions } from 'node:stream';

/* eslint-disable no-console */

type State = 'Header' | 'Payload';

export class FrameReaderStream extends Transform {
    private kind = -1;
    private need = HEADER_SIZE; // kind(1byte) and size(4bytes)

    private chunks: Buffer[] = [];
    private size = 0; // size of the collected buffer so far (chunks)
    private state: State = 'Header';
    private updated = false;

    constructor (options?: TransformOptions) {
        super({ ...options, readableObjectMode: true });
    }

    _transform (chunk: Buffer, _: BufferEncoding, done: TransformCallback) {
        this.chunks.push(chunk);
        this.size += chunk.length;

        const loop = () => {
            this.notify();

            if (this.updated && this.size >= HEADER_SIZE) {
                setImmediate(loop);
            } else {
                done();
            }
        };

        loop();
    }

    readHeader (header: Buffer) {
        const type = header.readUInt8();
        const size = header.readUInt32BE(1);
        return [type, size];
    }

    validateChecksum (payload: Buffer, checksum: number) {
        let sum = this.kind;
        const sz = payload.length + 6; // payload + kind(1) + size(4) + checksum(1);

        for (let i = 0; i <= 24; i += 8) {
            sum += (sz >> i) & 0xff; // eslint-disable-line no-bitwise
        }

        for (const bt of payload) {
            sum += bt;
        }

        sum += checksum;
        return sum % 256 === 0;
    }

    handleFrame (frame: Buffer) {
        const payload = frame.subarray(0, frame.length - 1); // not counting the checksum byte
        const checksum = frame.readInt8(payload.length);

        if (!this.validateChecksum(payload, checksum)) {
            return this.push({
                kind: msgType.error,
                payload: Buffer.from(`Invalid checksum: ${checksum}`)
            });
        }

        return this.push({
            kind: this.kind,
            payload
        });
    }

    notify () {
        this.updated = false;

        if (this.state === 'Header') {
            if (this.size >= this.need) {
                const buffer = Buffer.concat(this.chunks);
                let msgSize: number;
                [this.kind, msgSize] = this.readHeader(buffer.subarray(0, HEADER_SIZE));
                this.need = msgSize - HEADER_SIZE;

                // cleanup
                if (buffer.length > HEADER_SIZE) {
                    const remainder = buffer.subarray(HEADER_SIZE);
                    this.chunks = [remainder];
                    this.size = remainder.length;
                } else {
                    this.chunks = [];
                    this.size = 0;
                }

                // flip state
                this.state = 'Payload';
            }
        }

        if (this.state === 'Payload') {
            if (this.size >= this.need) {
                const buffer = Buffer.concat(this.chunks);
                this.handleFrame(buffer.subarray(0, this.need));

                // cleanup
                if (buffer.length > this.need) {
                    const remainder = buffer.subarray(HEADER_SIZE);
                    this.chunks = [remainder];
                    this.size = remainder.length;
                } else {
                    this.chunks = [];
                    this.size = 0;
                }

                // flip state
                this.state = 'Header';
                this.need = HEADER_SIZE;
                this.updated = true;
            }
        }
    }
}
