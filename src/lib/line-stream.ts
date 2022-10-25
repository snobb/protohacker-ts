import { Transform, TransformCallback, TransformOptions } from 'node:stream';

export class LineStream extends Transform {
    private chunks: Buffer[];
    private buffer: string[];

    constructor (opts?: TransformOptions) {
        super({ ...opts });
        this.chunks = [];
        this.buffer = [];
    }

    _transform (chunk: Buffer, _: BufferEncoding, done: TransformCallback) {
        this.chunks.push(chunk);
        this.process(chunk.toString(), (data: string) => this.push(data));

        done();
    }

    process (chunk: string, cb: (arg: string)=> void) {
        let start = 0;

        if (chunk === '') {
            return;
        }

        for (;;) {
            const idx = chunk.indexOf('\n', start);

            if (idx === -1) {
                return this.buffer.push(chunk.substring(start));

            } else {
                // include the new line character with every line
                this.buffer.push(chunk.substring(start, idx + 1));
                cb(this.buffer.join(''));

                this.buffer = [];
                start = idx + 1;
            }
        }
    }
}
