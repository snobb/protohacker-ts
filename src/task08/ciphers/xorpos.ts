import { Cipher } from './index';

/* eslint-disable no-console */

// XorPos
// xorpos: XOR the byte by its position in the stream, starting from 0.
export class XorPos implements Cipher {
    do (b: number, pos: number): number {
        pos %= 256;
        return (b & 0xff) ^ pos;
    }

    undo (b: number, pos: number): number {
        return this.do(b, pos);
    }
}
