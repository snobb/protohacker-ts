import * as assert from 'node:assert';
import { FrameReaderStream } from './frame-reader-stream';
import { Payload } from './types';

describe('frame-reader-stream', () => {
    let stream: FrameReaderStream;

    beforeEach(() => {
        stream = new FrameReaderStream();
    });

    it('should send payload down on a valid frame', (done) => {
        stream.on('data', (obj: Payload) => {
            assert.strictEqual(0x51, obj.kind);
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
            assert.strictEqual(0x57, obj.kind);
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
            assert.strictEqual(0x57, obj.kind);
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
            assert.strictEqual(0x57, obj.kind);
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

    it('should send 3 messages in two unbalanced chunks successfully', (done) => {
        let semaphore = 3;

        stream.on('data', (obj: Payload) => {
            assert.strictEqual(0x57, obj.kind);
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
            assert.strictEqual(0x51, obj.kind); // ErrorKind
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
