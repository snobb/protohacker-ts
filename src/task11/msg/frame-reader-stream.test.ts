import * as assert from 'node:assert';
import { describe, test, beforeEach } from 'node:test';
import { msgType } from '.';
import { FrameReaderStream } from './frame-reader-stream';

describe("frame-reader-stream", () => {
  let stream: FrameReaderStream;

  beforeEach(() => {
    stream = new FrameReaderStream();
  });

  test("should send payload down on a valid frame", () => {
    return new Promise<void>((done) => {
      stream.end(Buffer.from([
        0x57, // PolicyResult
        0x00, 0x00, 0x00, 0x0a, // length 10
        0x00, 0x00, 0x00, 0x7b, // policy 123
        0x24, // checksum
      ]));
      stream.on('data', (obj) => {
        assert.strictEqual(msgType.policyResult, obj.kind);
        assert.deepEqual(Buffer.from([0x00, 0x00, 0x00, 0x7b]), obj.payload);
        done();
      });
    });
  });

  test("should send 2 payloads in one chunk successfully", () => {
    return new Promise<void>((done) => {
      let count = 0;
      stream.end(
        Buffer.from([
          0x57, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x7b, 0x24,
          0x57, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x7b, 0x24,
        ]),
      );
      stream.on('data', (obj) => {
        assert.strictEqual(msgType.policyResult, obj.kind);
        count++;
        if (count === 2) {
          done();
        }
      });
    });
  });

  test("should send an error on wrong checksum", () => {
    return new Promise<void>((done) => {
      stream.end(Buffer.from([
        0x57, 0x00, 0x00, 0x00, 0x0a, 0x00, 0x00, 0x00, 0x7b, 0x25
      ]));
      stream.on('data', (obj) => {
        assert.strictEqual(msgType.error, obj.kind);
        done();
      });
    });
  });
});
