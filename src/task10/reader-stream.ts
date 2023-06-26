import { Readable } from 'node:stream';

type Handler = (buffer: Buffer)=> Buffer | void;

const emptyBuffer = Buffer.from('');

// This implementation was highly inspired by George Borisov's implementation of the
// protohacker challege.
export class ReaderStream {
    private buffer = Buffer.alloc(0);
    private handlerFn?: Handler = undefined;

    constructor (private stream: Readable) {
        stream.on('data', (chunk: Buffer) => {
            this.buffer = Buffer.concat([this.buffer, chunk]);
            this.notify();
        });
    }

    readLine (delim = '\n') {
        return new Promise<Buffer>((resolve, reject) => {
            const code = delim.charCodeAt(0);
            const chunks: Buffer[] = [];

            this.addHandler((chunk) => {
                try {
                    for (let i = 0; i < chunk.length; i += 1) {
                        if (chunk[i] === code) {
                            chunks.push(chunk.subarray(0, i));
                            resolve(Buffer.concat(chunks));
                            return chunk.subarray(i + 1);
                        }
                    }

                    chunks.push(chunk);

                } catch (err) {
                    return reject(err);
                }
            });
        });
    }

    readBytes (n: number) {
        return new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            let size = 0;

            this.addHandler((chunk) => {
                try {
                    chunks.push(chunk);
                    size += chunk.length;

                    if (size >= n) {
                        const buffer = Buffer.concat(chunks);

                        resolve(buffer.subarray(0, n));
                        return buffer.subarray(n);
                    }

                } catch (err) {
                    return reject(err);
                }
            });
        });
    }

    private addHandler (fn: Handler) {
        if (this.handlerFn) {
            throw new Error('duplicate handler');
        }

        this.handlerFn = fn;
        this.notify();
        this.stream.resume();
    }

    private notify () {
        if (!this.handlerFn) {
            this.stream.pause();
            return;
        }

        const remainder = this.handlerFn(this.buffer);

        if (remainder) {
            this.buffer = remainder;
            this.handlerFn = undefined;

        } else {
            this.buffer = emptyBuffer;
        }
    }
}
