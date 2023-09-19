import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { SpeedMessageTransform } from './speed-msg';
import { TypeError } from './msg';

describe('streams', () => {
    describe('SpeedMessageTransform', () => {
        let stream: SpeedMessageTransform;

        beforeEach(() => {
            stream = new SpeedMessageTransform();
        });

        it('should produce 1 valid WantHeartbeat message', (_, done) => {
            const expSizes = [5];

            // Hexadecimal:    Decoded:
            // 40              WantHeartbeat{
            // 00 00 00 0a         interval: 10
            //                 }
            stream.end(Buffer.from([
                0x40, // wantHeartbeat
                0x00, 0x00, 0x00, 0x0a,
                // 0x00 // should be ignored
            ]));

            stream.on('data', (buf) => {
                assert.equal(buf.length, expSizes.shift());

                if (expSizes.length === 0) {
                    done();
                }
            });
        });

        it('should produce 1 valid Plate message', (_, done) => {
            const expSizes = [10];

            // Hexadecimal:    Decoded:
            // 40              WantHeartbeat{
            // 00 00 00 0a         interval: 10
            //                 }
            stream.end(Buffer.from([
                0x20, // plate message
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

        it('should produce 1 valid IAMCamera message', (_, done) => {
            const expSizes = [7];

            // 80              IAmCamera{
            // 00 42               road: 66,
            // 00 64               mile: 100,
            // 00 3c               limit: 60,
            //                 }
            stream.end(Buffer.from([
                0x80, // IAMCamera message
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

        it('should produce 1 valid IAMDispatcher message', (_, done) => {
            const expSizes = [8];

            // 81              IAmDispatcher{
            // 03                  roads: [
            // 00 42                   66,
            // 01 70                   368,
            // 13 88                   5000
            //                     ]
            //                 }
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

        it('should produce 2 valid messages', (_, done) => {
            const expSizes = [10, 5];

            // Hexadecimal:                Decoded:
            // 20                          Plate{
            // 04 55 4e 31 58                  plate: "UN1X",
            // 00 00 03 e8                     timestamp: 1000
            //                             }
            // Hexadecimal:    Decoded:
            // 40              WantHeartbeat{
            // 00 00 00 0a         interval: 10
            //                 }
            stream.end(Buffer.from([
                0x20, // plate message
                0x04, 0x55, 0x4e, 0x31, 0x58,
                0x00, 0x00, 0x03, 0xe8,
                0x40, // wantHeartbeat
                0x00, 0x00, 0x00, 0x0a
            ]));

            stream.on('data', (buf) => {
                assert.equal(buf.length, expSizes.shift());

                if (expSizes.length === 0) {
                    done();
                }
            });
        });

        it('should produce 2 valid messages spread across several buffers', (_, done) => {
            const expSizes = [10, 5];

            // Hexadecimal:                Decoded:
            // 20                          Plate{
            // 04 55 4e 31 58                  plate: "UN1X",
            // 00 00 03 e8                     timestamp: 1000
            //                             }
            // Hexadecimal:    Decoded:
            // 40              WantHeartbeat{
            // 00 00 00 0a         interval: 10
            //                 }
            stream.write(Buffer.from([
                0x20, // plate message
            ]));

            stream.write(Buffer.from([
                0x04, 0x55, 0x4e, 0x31, 0x58,
            ]));

            stream.end(Buffer.from([
                0x00, 0x00, 0x03, 0xe8,
                0x40, // wantHeartbeat
                0x00, 0x00, 0x00, 0x0a
            ]));

            stream.on('data', (buf) => {
                assert.equal(buf.length, expSizes.shift());

                if (expSizes.length === 0) {
                    done();
                }
            });
        });

        it('should produce 3 valid messages spread across several buffers', (_, done) => {
            const expSizes = [10, 5, 7];

            // Hexadecimal:                Decoded:
            // 20                          Plate{
            // 04 55 4e 31 58                  plate: "UN1X",
            // 00 00 03 e8                     timestamp: 1000
            //                             }
            // Hexadecimal:    Decoded:
            // 40              WantHeartbeat{
            // 00 00 00 0a         interval: 10
            //                 }
            stream.write(Buffer.from([
                0x20, // plate message
            ]));

            stream.write(Buffer.from([
                0x04, 0x55, 0x4e, 0x31, 0x58,
            ]));

            stream.write(Buffer.from([
                0x00, 0x00, 0x03, 0xe8,
                0x40, // wantHeartbeat
            ]));

            stream.write(Buffer.from([
                0x00, 0x00, 0x00, 0x0a,
                0x80, // IAMCamera message
            ]));

            // 80              IAmCamera{
            // 00 42               road: 66,
            // 00 64               mile: 100,
            // 00 3c               limit: 60,
            //                 }
            stream.write(Buffer.from([
                0x00, 0x42,
                0x00, 0x64,
                0x00, 0x3c
            ]));

            stream.end(Buffer.from([
            ]));

            stream.on('data', (buf) => {
                assert.equal(buf.length, expSizes.shift());

                if (expSizes.length === 0) {
                    done();
                }
            });
        });

        it('should produce 2 valid messages by spoonfeeding byte by byte', (_, done) => {
            const expSizes = [10, 5];

            // Hexadecimal:                Decoded:
            // 20                          Plate{
            // 04 55 4e 31 58                  plate: "UN1X",
            // 00 00 03 e8                     timestamp: 1000
            //                             }
            // Hexadecimal:    Decoded:
            // 40              WantHeartbeat{
            // 00 00 00 0a         interval: 10
            //                 }
            const bytes = [
                0x20, // plate message
                0x04, 0x55, 0x4e, 0x31, 0x58,
                0x00, 0x00, 0x03, 0xe8,
                0x40, // wantHeartbeat
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

        it('should error message on invalid message', (_, done) => {

            stream.end(Buffer.of(42));

            stream.on('data', (buf) => {
                assert.equal(buf[0], TypeError);
                assert.equal(buf[1], buf.length - 2); // string length
                assert.equal('Invalid message type', buf.subarray(2, 22).toString());
                done();
            });

        });
    });
});
