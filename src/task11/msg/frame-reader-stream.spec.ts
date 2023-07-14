import * as assert from 'node:assert';
import { Payload, msgType } from '.';
import { FrameReaderStream } from './frame-reader-stream';

describe('frame-reader-stream', () => {
    let stream: FrameReaderStream;

    beforeEach(() => {
        stream = new FrameReaderStream();
    });

    it('should send payload down on a valid frame', (done) => {
        stream.on('data', (obj: Payload) => {
            assert.strictEqual(msgType.error, obj.kind);
            assert.deepEqual(Buffer.from([
                0x00, 0x00, 0x00, 0x03,
                0x62, 0x61, 0x64,
            ]), obj.payload);
            done();
        });

        stream.end(Buffer.from([
            0x51, // Error{
            0x00, 0x00, 0x00, 0x0d, //   (length 13)
            0x00, 0x00, 0x00, 0x03, //   message: (length 3)
            0x62, 0x61, 0x64, //    "bad",
            0x78 //   (checksum 0x78)
        ]));
    });

    it('should send payload of a different down on a valid frame', (done) => {
        stream.on('data', (obj: Payload) => {
            assert.strictEqual(msgType.policyResult, obj.kind);
            assert.deepEqual(Buffer.from([
                0x00, 0x00, 0x00, 0x7b,
            ]), obj.payload);
            done();
        });

        stream.end(Buffer.from([
            0x57, // PolicyResult{
            0x00, 0x00, 0x00, 0x0a, //   (length 10)
            0x00, 0x00, 0x00, 0x7b, //   policy: 123,
            0x24 //   (checksum 0x24)
        ]));
    });

    it('should send 2 payloads of two valid frame', (done) => {
        let semaphore = 2;

        stream.on('data', (obj: Payload) => {
            assert.strictEqual(msgType.policyResult, obj.kind);
            assert.deepEqual(Buffer.from([
                0x00, 0x00, 0x00, 0x7b,
            ]), obj.payload);

            semaphore -= 1;
            if (semaphore === 0) {
                done();
            }
        });

        stream.write(Buffer.from([
            0x57, // PolicyResult{
            0x00, 0x00, 0x00, 0x0a, //   (length 10)
            0x00, 0x00, 0x00, 0x7b, //   policy: 123,
            0x24 //   (checksum 0x24)
        ]));

        stream.end(Buffer.from([
            0x57, // PolicyResult{
            0x00, 0x00, 0x00, 0x0a, //   (length 10)
            0x00, 0x00, 0x00, 0x7b, //   policy: 123,
            0x24 //   (checksum 0x24)
        ]));
    });

    it('should send 2 payloads in one chunk successfully', (done) => {
        let semaphore = 2;

        stream.on('data', (obj: Payload) => {
            assert.strictEqual(msgType.policyResult, obj.kind);
            assert.deepEqual(Buffer.from([
                0x00, 0x00, 0x00, 0x7b,
            ]), obj.payload);

            semaphore -= 1;
            if (semaphore === 0) {
                done();
            }
        });

        stream.end(Buffer.from([
            0x57, // PolicyResult{
            0x00, 0x00, 0x00, 0x0a, //   (length 10)
            0x00, 0x00, 0x00, 0x7b, //   policy: 123,
            0x24, //   (checksum 0x24)
            0x57, // PolicyResult{
            0x00, 0x00, 0x00, 0x0a, //   (length 10)
            0x00, 0x00, 0x00, 0x7b, //   policy: 123,
            0x24 //   (checksum 0x24)
        ]));
    });

    it('should send 2 payloads in one chunk successfully (hello/site-visit)', (done) => {
        let semaphore = 2;
        const expect = [
            {
                kind: msgType.hello,
                payload: [
                    0x00, 0x00, 0x00, 0x0b, //  protocol: (length 11)
                    0x70, 0x65, 0x73, 0x74, //   "pest
                    0x63, 0x6f, 0x6e, 0x74, //    cont
                    0x72, 0x6f, 0x6c, //          rol"
                    0x00, 0x00, 0x00, 0x01, //  version: 1
                ]
            },
            {
                kind: msgType.siteVisit,
                payload: [
                    0x00, 0x00, 0x30, 0x39, //    site: 12345,
                    0x00, 0x00, 0x00, 0x02, //    populations: (length 2) [
                    0x00, 0x00, 0x00, 0x03, //        name: (length 3)
                    0x64, 0x6f, 0x67, //              "dog",
                    0x00, 0x00, 0x00, 0x01, //        count: 1,
                    0x00, 0x00, 0x00, 0x03, //        name: (length 3)
                    0x72, 0x61, 0x74, //              "rat",
                    0x00, 0x00, 0x00, 0x05, //         count: 5,
                ]
            }
        ];

        stream.on('data', (obj: Payload) => {
            const ex = expect.shift();
            if (!ex) {
                assert.fail('must not happen');
            }

            assert.strictEqual(ex.kind, obj.kind);
            assert.deepEqual(Buffer.from(ex.payload), obj.payload);

            semaphore -= 1;
            if (semaphore === 0) {
                done();
            }
        });

        stream.end(Buffer.from([
            0x50, //                    Hello {
            0x00, 0x00, 0x00, 0x19, //  (length 25)
            0x00, 0x00, 0x00, 0x0b, //  protocol: (length 11)
            0x70, 0x65, 0x73, 0x74, //   "pest
            0x63, 0x6f, 0x6e, 0x74, //    cont
            0x72, 0x6f, 0x6c, //          rol"
            0x00, 0x00, 0x00, 0x01, //  version: 1
            0xce, //                    }

            0x58, //                    SiteVisit{
            0x00, 0x00, 0x00, 0x24, //       (length 36)
            0x00, 0x00, 0x30, 0x39, //    site: 12345,
            0x00, 0x00, 0x00, 0x02, //    populations: (length 2) [
            0x00, 0x00, 0x00, 0x03, //        name: (length 3)
            0x64, 0x6f, 0x67, //              "dog",
            0x00, 0x00, 0x00, 0x01, //        count: 1,
            0x00, 0x00, 0x00, 0x03, //        name: (length 3)
            0x72, 0x61, 0x74, //              "rat",
            0x00, 0x00, 0x00, 0x05, //         count: 5,
            0x8c, //                    }
        ]));
    });

    it('should send 3 messages in two unbalanced chunks successfully', (done) => {
        let semaphore = 3;

        stream.on('data', (obj: Payload) => {
            assert.strictEqual(msgType.policyResult, obj.kind);
            assert.deepEqual(Buffer.from([
                0x00, 0x00, 0x00, 0x7b,
            ]), obj.payload);

            semaphore -= 1;
            if (semaphore === 0) {
                done();
            }
        });

        stream.write(Buffer.from([
            0x57, // PolicyResult{
            0x00, 0x00, 0x00, 0x0a, //   (length 10)
            0x00, 0x00, 0x00, 0x7b, //   policy: 123,
            0x24, //   (checksum 0x24)
            0x57, // PolicyResult{
            0x00, 0x00, 0x00, 0x0a, //   (length 10)
        ]));

        stream.end(Buffer.from([
            0x00, 0x00, 0x00, 0x7b, //   policy: 123,
            0x24, //   (checksum 0x24)
            0x57, // PolicyResult{
            0x00, 0x00, 0x00, 0x0a, //   (length 10)
            0x00, 0x00, 0x00, 0x7b, //   policy: 123,
            0x24, //   (checksum 0x24)
        ]));
    });

    it('should send an error on wrong checksum', (done) => {
        stream.on('data', (obj: Payload) => {
            assert.strictEqual(msgType.error, obj.kind);
            done();
        });

        stream.end(Buffer.from([
            0x57, // PolicyResult{
            0x00, 0x00, 0x00, 0x0a, //   (length 10)
            0x00, 0x00, 0x00, 0x7b, //   policy: 123,
            0x25 //   (checksum 0x24)
        ]));
    });
});
