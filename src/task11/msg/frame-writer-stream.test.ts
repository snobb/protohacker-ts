import * as assert from 'node:assert';
import { describe, test, beforeEach } from 'node:test';
import { Payload, msgType } from '.';
import { FrameWriterStream } from './frame-writer-stream';

describe('frame-writer-stream', () => {
    let stream: FrameWriterStream;

    beforeEach(() => {
        stream = new FrameWriterStream();
    });

    test('should encode a single message correctly', () => {
        return new Promise<void>((done) => {
            const chunks: Buffer[] = [];
            stream.end(<Payload>{
                kind: msgType.policyResult,
                payload: Buffer.from([0x00, 0x00, 0x00, 0x7b]),
            });
            const expect = Buffer.from([
                0x57,
                0x00,
                0x00,
                0x00,
                0x0a,
                0x00,
                0x00,
                0x00,
                0x7b,
                0x24,
            ]);
            stream.on('data', (chunk) => {
                chunks.push(chunk);
            });
            stream.on('end', () => {
                assert.deepEqual(Buffer.concat(chunks), expect);
                done();
            });
        });
    });
});
