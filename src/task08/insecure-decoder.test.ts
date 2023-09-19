import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { InsecureDecoderStream } from './insecure-decoder';

/* eslint-disable no-console */

describe('insecure-decoder', () => {
    let dec: InsecureDecoderStream;

    beforeEach(() => {
        dec = new InsecureDecoderStream();
    });

    describe('decode', () => {
        it('should decode stream with only xor(1) cipher', (_, done) => {
            dec.on('data', (chunk) => {
                assert.equal('hello', chunk.toString());
                done();
            });

            dec.end(Buffer.from([
                0x02, 0x01, 0x00, // xor(1) cipher
                0x69, 0x64, 0x6d, 0x6d, 0x6e // XOR(1)ed hello
            ]));
        });

        it('should decode stream with xor(1) and reversebits cipher', (_, done) => {
            dec.on('data', (chunk) => {
                assert.equal('hello', chunk.toString());
                done();
            });

            dec.end(Buffer.from([
                0x02, 0x01, // xor(1) cipher
                0x01, 0x00, // reverse & end of ciphers
                0x96, 0x26, 0xb6, 0xb6, 0x76 // XOR(1)ed hello
            ]));
        });

        it('should decode stream with only xorpos cipher', (_, done) => {
            dec.on('data', (chunk) => {
                assert.equal('hello', chunk.toString());
                done();
            });

            dec.end(Buffer.from([
                0x03, 0x00, // xorpos cipher
                0x68, 0x64, 0x6e, 0x6f, 0x6b // XORPOSed hello
            ]));
        });

        it('should decode stream with only add(1) cipher', (_, done) => {
            dec.on('data', (chunk) => {
                assert.equal('hello', chunk.toString());
                done();
            });

            dec.end(Buffer.from([
                0x04, 0x01, 0x00, // add(1) cipher
                0x69, 0x66, 0x6d, 0x6d, 0x70 // Add(1)ed hello
            ]));
        });

        it('should decode stream with only addpos cipher', (_, done) => {
            dec.on('data', (chunk) => {
                assert.equal('hello', chunk.toString());
                done();
            });

            dec.end(Buffer.from([
                0x05, 0x00, // add(1) cipher
                0x68, 0x66, 0x6e, 0x6f, 0x73 // Add(1)ed hello
            ]));
        });

        it('should decode stream with 2 addpos cipher', (_, done) => {
            dec.on('data', (chunk) => {
                assert.equal('hello', chunk.toString());
                done();
            });

            dec.end(Buffer.from([
                0x05, 0x05, 0x00, // add(1) cipher
                0x68, 0x67, 0x70, 0x72, 0x77 // Add(1)ed hello
            ]));
        });
    });
});
