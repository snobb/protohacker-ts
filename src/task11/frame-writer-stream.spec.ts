import * as assert from 'node:assert';
import { FrameWriterStream } from './frame-writer-stream';
import { Payload } from './types';

describe('frame-writer-stream', () => {
    let stream: FrameWriterStream;

    beforeEach(() => {
        stream = new FrameWriterStream();
    });

    it('should encode a single message correctly', (done) => {
        stream.on('data', (chunk) => {
            const expect = Buffer.from([
                0x57, // PolicyResult{
                0x00, 0x00, 0x00, 0x0a, //   (length 10)
                0x00, 0x00, 0x00, 0x7b, //   policy: 123,
                0x24 //   (checksum 0x24)
            ]);
            assert.deepEqual(chunk, expect);
            done();
        });

        stream.end(<Payload>{
            kind: 0x57,
            payload: Buffer.from([0x00, 0x00, 0x00, 0x7b])
        });
    });
});
