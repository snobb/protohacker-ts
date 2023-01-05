import { Transform, TransformCallback, TransformOptions } from 'node:stream';

/* eslint-disable no-console */

export class AppStream extends Transform {
    private re = /^(\d+)x/;

    constructor (opts?: TransformOptions) {
        super({ ...opts });
    }

    _transform (chunk: Buffer, _: BufferEncoding, done: TransformCallback) {
        const lines = chunk.toString().split(',');

        if (chunk.length === 0 || lines.length === 0) {
            return done();
        }

        let [maxIdx, maxVal] = [-1, -1];
        for (let i = 0; i < lines.length; i += 1) {
            const match = lines[i].match(this.re);
            if (!match) {
                console.log('invalid line: no quantity');
                continue;
            }

            const curVal = parseInt(match[1], 10);
            if (maxVal < curVal) {
                maxVal = curVal;
                maxIdx = i;
            }
        }

        if (maxIdx >= 0) {
            const line = lines[maxIdx];
            this.push((line[line.length - 1] === '\n') ? line : `${line}\n`);
        }

        done();
    }
}
