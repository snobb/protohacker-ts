import * as assert from 'node:assert';
import { describe, test, beforeEach } from 'node:test';
import { SpeedMessageTransform } from './speed-msg';
import { TypeError } from './msg';

describe('streams', () => {
    describe('SpeedMessageTransform', () => {
        let stream: SpeedMessageTransform;

        beforeEach(() => {
            stream = new SpeedMessageTransform();
        });

        test('should produce 1 valid WantHeartbeat message', () => {
            return new Promise<void>((done) => {
                const expSizes = [5];
                stream.end(Buffer.from([
                    0x40,
                    0x00, 0x00, 0x00, 0x0a,
                ]));
                stream.on('data', (buf) => {
                    assert.equal(buf.length, expSizes.shift());
                    if (expSizes.length === 0) {
                        done();
                    }
                });
            });
        });

        test('should produce 1 valid Plate message', () => {
            return new Promise<void>((done) => {
                const expSizes = [10];
                stream.end(Buffer.from([
                    0x20,
                    0x04, 0x55, 0x4e, 0x31, 0x58,
                    0x00, 0x00, 0x03, 0xe8,
                ]));
                stream.on('data', (buf) => {
                    assert.equal(buf.length, expSizes.shift());
                    if (expSizes.length === 0) {
                        done();
                    }
                });
            });
        });

        test('should produce 1 valid IAMCamera message', () => {
            return new Promise<void>((done) => {
                const expSizes = [7];
                stream.end(Buffer.from([
                    0x80,
                    0x00, 0x42,
                    0x00, 0x64,
                    0x00, 0x3c
                ]));
                stream.on('data', (buf) => {
                    assert.equal(buf.length, expSizes.shift());
                    if (expSizes.length === 0) {
                        done();
                    }
                });
            });
        });

        test('should produce 1 valid IAMDispatcher message', () => {
            return new Promise<void>((done) => {
                const expSizes = [8];
                stream.end(Buffer.from([
                    0x81,
                    0x03,
                    0x00, 0x42,
                    0x01, 0x70,
                    0x13, 0x88
                ]));
                stream.on('data', (buf) => {
                    assert.equal(buf.length, expSizes.shift());
                    if (expSizes.length === 0) {
                        done();
                    }
                });
            });
        });

        test('should produce 2 valid messages', () => {
            return new Promise<void>((done) => {
                const expSizes = [10, 5];
                stream.end(Buffer.from([
                    0x20,
                    0x04, 0x55, 0x4e, 0x31, 0x58,
                    0x00, 0x00, 0x03, 0xe8,
                    0x40,
                    0x00, 0x00, 0x00, 0x0a
                ]));
                stream.on('data', (buf) => {
                    assert.equal(buf.length, expSizes.shift());
                    if (expSizes.length === 0) {
                        done();
                    }
                });
            });
        });

        test('should produce 2 valid messages spread across several buffers', () => {
            return new Promise<void>((done) => {
                const expSizes = [10, 5];
                stream.write(Buffer.from([0x20]));
                stream.write(Buffer.from([0x04, 0x55, 0x4e, 0x31, 0x58]));
                stream.end(Buffer.from([
                    0x00, 0x00, 0x03, 0xe8,
                    0x40,
                    0x00, 0x00, 0x00, 0x0a
                ]));
                stream.on('data', (buf) => {
                    assert.equal(buf.length, expSizes.shift());
                    if (expSizes.length === 0) {
                        done();
                    }
                });
            });
        });

        test('should produce 3 valid messages spread across several buffers', () => {
            return new Promise<void>((done) => {
                const expSizes = [10, 5, 7];
                stream.write(Buffer.from([0x20]));
                stream.write(Buffer.from([0x04, 0x55, 0x4e, 0x31, 0x58]));
                stream.write(Buffer.from([0x00, 0x00, 0x03, 0xe8, 0x40]));
                stream.write(Buffer.from([0x00, 0x00, 0x00, 0x0a, 0x80]));
                stream.write(Buffer.from([0x00, 0x42, 0x00, 0x64, 0x00, 0x3c]));
                stream.end();
                stream.on('data', (buf) => {
                    assert.equal(buf.length, expSizes.shift());
                    if (expSizes.length === 0) {
                        done();
                    }
                });
            });
        });

        test('should produce 2 valid messages by spoonfeeding byte by byte', () => {
            return new Promise<void>((done) => {
                const expSizes = [10, 5];
                const bytes = [
                    0x20,
                    0x04, 0x55, 0x4e, 0x31, 0x58,
                    0x00, 0x00, 0x03, 0xe8,
                    0x40,
                    0x00, 0x00, 0x00, 0x0a
                ];
                bytes.forEach((byte) => stream.write(Buffer.of(byte)));
                stream.end();
                stream.on('data', (buf) => {
                    assert.equal(buf.length, expSizes.shift());
                    if (expSizes.length === 0) {
                        done();
                    }
                });
            });
        });

        test('should error message on invalid message', () => {
            return new Promise<void>((done) => {
                stream.end(Buffer.of(42));
                stream.on('data', (buf) => {
                    assert.equal(buf[0], TypeError);
                    assert.equal(buf[1], buf.length - 2);
                    assert.equal(buf.subarray(2, 22).toString(), 'Invalid message type');
                    done();
                });
            });
        });
    });
});
