import * as assert from 'node:assert';
import { Readable } from 'node:stream';
import { ReaderStream } from './reader-stream';

describe('stream-reader', () => {
    let stream: ReaderStream;
    const data = Buffer.from('foo bar baz\nbig long data\njohn doe\n');

    beforeEach(() => {
        stream = new ReaderStream(Readable.from(data));
    });

    it('should read a single line off the readable stream', async () => {
        let line = await stream.readLine();
        assert.strictEqual(line.toString(), 'foo bar baz');

        line = await stream.readLine();
        assert.strictEqual(line.toString(), 'big long data');

        line = await stream.readLine();
        assert.strictEqual(line.toString(), 'john doe');
    });

    it('should read N bytes off the readable stream', async () => {
        let line = await stream.readBytes(7);
        assert.strictEqual(line.toString(), 'foo bar');

        line = await stream.readBytes(4);
        assert.strictEqual(line.toString(), ' baz');
    });
});
