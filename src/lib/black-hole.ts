import { Writable, WritableOptions } from 'node:stream';

/* eslint-disable no-console */

export class BlackHole extends Writable {
    private size: number;

    constructor (opts: WritableOptions) {
        super(opts);
        this.size = 0;
    }

    _write (chunk: Buffer, _: BufferEncoding, done: ()=> void) {
        console.log(chunk.toString());
        this.size += chunk.length;
        done();
    }

    _final () {
        let size = this.size; let
            sfx;

        if (size / 1024 >= 1) {
            size /= 1024;
            sfx = 'kb';
        }

        if (size / 1024 >= 1) {
            size /= 1024;
            sfx = 'mb';
        }

        if (size / 1024 >= 1) {
            size /= 1024;
            sfx = 'gb';
        }

        console.log(`processed: ${size.toFixed(2)}${sfx}`);
    }
}
