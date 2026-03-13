import * as assert from 'node:assert';
import { describe, test, beforeEach } from 'node:test';
import { InsecureDecoderStream } from './insecure-decoder';

describe('insecure-decoder', () => {
    let dec: InsecureDecoderStream;

    beforeEach(() => {
        dec = new InsecureDecoderStream();
    });

    describe('decode', () => {
        test('should decode stream with only xor(1) cipher', async () => {
            const chunks: Buffer[] = [];
            dec.end(
                Buffer.from([
                    0x02,
                    0x01,
                    0x00,
                    0x69,
                    0x64,
                    0x6d,
                    0x6d,
                    0x6e,
                ]),
            );
            for await (const chunk of dec) {
                chunks.push(chunk);
            }
            assert.equal(chunks[0].toString(), 'hello');
        });

        test('should decode stream with xor(1) and reversebits cipher', async () => {
            const chunks: Buffer[] = [];
            dec.end(
                Buffer.from([
                    0x02,
                    0x01,
                    0x01,
                    0x00,
                    0x96,
                    0x26,
                    0xb6,
                    0xb6,
                    0x76,
                ]),
            );
            for await (const chunk of dec) {
                chunks.push(chunk);
            }
            assert.equal(chunks[0].toString(), 'hello');
        });

        test('should decode stream with only xorpos cipher', async () => {
            const chunks: Buffer[] = [];
            dec.end(
                Buffer.from([
                    0x03,
                    0x00,
                    0x68,
                    0x64,
                    0x6e,
                    0x6f,
                    0x6b,
                ]),
            );
            for await (const chunk of dec) {
                chunks.push(chunk);
            }
            assert.equal(chunks[0].toString(), 'hello');
        });

        test('should decode stream with only add(1) cipher', async () => {
            const chunks: Buffer[] = [];
            dec.end(
                Buffer.from([
                    0x04,
                    0x01,
                    0x00,
                    0x69,
                    0x66,
                    0x6d,
                    0x6d,
                    0x70,
                ]),
            );
            for await (const chunk of dec) {
                chunks.push(chunk);
            }
            assert.equal(chunks[0].toString(), 'hello');
        });

        test('should decode stream with only addpos cipher', async () => {
            const chunks: Buffer[] = [];
            dec.end(
                Buffer.from([
                    0x05,
                    0x00,
                    0x68,
                    0x66,
                    0x6e,
                    0x6f,
                    0x73,
                ]),
            );
            for await (const chunk of dec) {
                chunks.push(chunk);
            }
            assert.equal(chunks[0].toString(), 'hello');
        });

        test('should decode stream with 2 addpos cipher', async () => {
            const chunks: Buffer[] = [];
            dec.end(
                Buffer.from([
                    0x05,
                    0x05,
                    0x00,
                    0x68,
                    0x67,
                    0x70,
                    0x72,
                    0x77,
                ]),
            );
            for await (const chunk of dec) {
                chunks.push(chunk);
            }
            assert.equal(chunks[0].toString(), 'hello');
        });
    });
});
