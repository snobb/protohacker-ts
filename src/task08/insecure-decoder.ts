import { Add, AddPos, Cipher, Reverse, Xor, XorPos } from './ciphers';
import { Transform, TransformCallback, TransformOptions } from 'node:stream';

/* eslint-disable no-console */

export class InsecureDecoderStream extends Transform {
    private posIn = 0;
    private posOut = 0;
    private ciphers: Cipher[] = [];
    private initialised = false;
    private chunks: Buffer[] = [];

    constructor (opts?: TransformOptions) {
        super({ ...opts });
    }

    _transform (chunk: Buffer, _: BufferEncoding, done: TransformCallback) {
        if (this.initialised) {
            this.decode(chunk);
        } else {
            this.initialise(chunk);
        }

        done();
    }

    initialise (chunk: Buffer) {
        if (this.chunks.length > 0) {
            this.chunks.push(chunk);
            chunk = Buffer.concat(this.chunks);
            this.chunks = [];
        }

        for (let i = 0; i < chunk.length; i += 1) {
            switch (chunk[i]) {
            case 0x00: // end of cipher string
                this.initialised = true;
                this.validateCiphers();

                // leave only the encoded payload and process it.
                chunk = chunk.subarray(i + 1);
                this.decode(chunk);
                return;

            case 0x01: // reversebits
                this.ciphers.push(new Reverse());
                break;

            case 0x02: // xor(N)
                if (i + 1 === chunk.length) {
                    // end of buffer in a middle of xor.
                    this.chunks.push(chunk.subarray(i));
                    return;
                }

                i += 1;
                this.ciphers.push(new Xor(chunk[i]));
                break;

            case 0x03: // xorpos
                this.ciphers.push(new XorPos());
                break;

            case 0x04: // add(N)
                if (i + 1 === chunk.length) {
                    // end of buffer in a middle of xor.
                    this.chunks.push(chunk.subarray(i));
                    return;
                }

                i += 1;
                this.ciphers.push(new Add(chunk[i]));
                break;

            case 0x05: // addpos
                this.ciphers.push(new AddPos());
                break;

            default:
                this.destroy(new Error('invalid cipher'));
            }
        }
    }

    validateCiphers () {
        const testStr = 'foobar';
        const res: number[] = [];
        let pos = 0;

        if (this.ciphers.length === 0) {
            this.destroy(new Error('no-op cipher'));
        }

        for (let bb of Buffer.from(testStr)) {
            for (const cipher of this.ciphers) {
                bb = cipher.do(bb, pos);
            }

            res.push(bb);
            pos += 1;
        }

        if (Buffer.from(res).toString() === testStr) {
            this.destroy(new Error('no-op cipher'));
        }
    }

    encode (chunk: Buffer): Buffer {
        const res: number[] = [];
        for (let bb of chunk) {
            for (let i = 0; i < this.ciphers.length; i += 1) {
                bb = this.ciphers[i].do(bb, this.posOut % 256);
            }

            this.posOut += 1;
            res.push(bb);
        }

        return Buffer.from(res);
    }

    decode (chunk: Buffer) {
        const res: number[] = [];

        for (let bb of chunk) {
            for (let i = this.ciphers.length - 1; i >= 0; i -= 1) {
                bb = this.ciphers[i].undo(bb, this.posIn % 256);
            }

            this.posIn += 1;
            res.push(bb);
        }

        this.push(Buffer.from(res));
    }
}
