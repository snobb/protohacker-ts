import * as assert from 'node:assert';
import { Payload, msgType } from '.';
import { beforeEach, describe, it } from 'node:test';
import { FrameWriterStream } from './frame-writer-stream';

describe('frame-writer-stream', () => {
    let stream: FrameWriterStream;

    beforeEach(() => {
        stream = new FrameWriterStream();
    });

    it('should encode a single message correctly', (_, done) => {
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
            kind: msgType.policyResult,
            payload: Buffer.from([0x00, 0x00, 0x00, 0x7b])
        });
    });
});
