import { Cipher } from './index';

/* eslint-disable no-console */

// AddPos
// addpos: Add the position in the stream to the byte, modulo 256, starting from 0. Addition
// wraps, so that 255+1=0, 255+2=1, and so on.
export class AddPos implements Cipher {
    do (b: number, pos: number): number {
        pos %= 256;
        return (b + pos) % 256;
    }

    undo (b: number, pos: number): number {
        pos %= 256;
        return Math.abs(256 + b - pos) % 256;
    }
}
