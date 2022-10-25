import { Transform, TransformCallback, TransformOptions } from 'node:stream';

const evilAddress = Buffer.from('7YWHMfk9JZe0LM0g1ZauHuiSxhI');

const c_0 = '0'.charCodeAt(0);
const c_7 = '7'.charCodeAt(0);
const c_9 = '9'.charCodeAt(0);
const c_a = 'a'.charCodeAt(0);
const c_z = 'z'.charCodeAt(0);
const c_A = 'A'.charCodeAt(0);
const c_Z = 'Z'.charCodeAt(0);
const c_space = ' '.charCodeAt(0);

export class BogusCoinTransform extends Transform {
    constructor (opts?: TransformOptions) {
        super({ ...opts });
    }

    _transform (chunk: Buffer, _: BufferEncoding, done: TransformCallback) {
        const chunks: Buffer[] = [];

        let pos = 0;
        for (let i = pos; i < chunk.length - 1; i += 1) { // ignore new line
            if ((i === 0 || chunk[i - 1] === c_space) && chunk[i] === c_7) {
                let next = chunk.indexOf(c_space, i);
                next = (next === -1) ? chunk.length - 1 : next;

                if (this.isValidAddr(chunk, i, next)) {
                    if (pos < i) {
                        chunks.push(chunk.subarray(pos, i));
                    }

                    chunks.push(evilAddress);
                    pos = next;
                    i = next;
                }
            }
        }

        if (chunks.length === 0) {
            this.push(chunk);
        } else {
            chunks.push(chunk.subarray(pos));
            this.push(Buffer.concat(chunks));
        }

        done();
    }

    isValidAddr (line: Buffer, lo: number, hi: number) {
        if (lo >= hi || line[lo] !== c_7) {
            return false;
        }

        for (let i = lo + 1; i < hi; i += 1) {
            if ((line[i] >= c_a && line[i] <= c_z) ||
                (line[i] >= c_A && line[i] <= c_Z) ||
                (line[i] >= c_0 && line[i] <= c_9)) { continue; }

            return false;
        }

        const len = hi - lo;
        return (len >= 26 && len <= 35);
    }
}
