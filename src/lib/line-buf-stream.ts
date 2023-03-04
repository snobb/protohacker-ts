import { Transform, TransformCallback, TransformOptions } from 'node:stream';

// This Stream is intended to inherit from, so that the child class can signal the desire of
// getting a line or a buffer of given size next.
export class LineBufStream extends Transform {
    private chunks: Buffer[];
    private bufSize = 0;

    constructor (opts?: TransformOptions) {
        super({ ...opts });
        this.chunks = [];
    }

    _transform (chunk: Buffer, _: BufferEncoding, done: TransformCallback) {
        this.chunks.push(chunk);
        this.bufSize += chunk.length;
        this.emit('chunk');

        done();
    }

    shiftChunk () {
        const chunk = this.chunks.shift();
        if (!chunk) {
            return;
        }

        this.bufSize -= chunk.length;
        return chunk;
    }

    unshiftChunk (chunk: Buffer) {
        this.chunks.unshift(chunk);
        this.bufSize += chunk.length;
    }

    readLine (): Promise<Buffer> {
        return new Promise((resolve) => {
            const chunks: Buffer[] = [];

            const handleChunks = () => {
                while (this.chunks.length > 0) {
                    const chunk = this.shiftChunk();
                    if (!chunk) {
                        break;
                    }

                    for (let i = 0; i < chunk.length; i += 1) {
                        if (chunk[i] === '\n'.charCodeAt(0)) {
                            // include the new line character with every line
                            chunks.push(chunk.subarray(0, i + 1));

                            if (chunk.length > i + 1) {
                                // putting the unused part back
                                this.unshiftChunk(chunk.subarray(i + 1));
                            }

                            resolve(Buffer.concat(chunks));
                            return true;
                        }
                    }

                    chunks.push(chunk);
                }

                return false;
            };

            if (!handleChunks()) {
                const handler = () => {
                    if (handleChunks()) {
                        this.removeListener('chunk', handler);
                    }
                };

                this.on('chunk', handler);
            }
        });
    }

    read (size: number) {
        return new Promise((resolve) => {
            const handleChunks = () => {
                if (this.bufSize >= size) {
                    const chunks = Buffer.concat(this.chunks);
                    const data = chunks.subarray(0, size);

                    this.chunks = [chunks.subarray(size)];
                    this.bufSize = this.chunks[0].length;
                    resolve(data);
                    return true;
                }

                return false;
            };

            if (!handleChunks()) {
                const handler = () => {
                    if (handleChunks()) {
                        this.removeListener('chunk', handler);
                    }
                };

                this.on('chunk', handler);
            }
        });
    }
}
