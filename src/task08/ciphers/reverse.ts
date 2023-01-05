import { Cipher } from './index';

// Reverse
// reverse: Reverse the order of bits in the byte, so the least-significant bit becomes the
// most-significant bit, the 2nd-least-significant becomes the 2nd-most-significant, and so on.
export class Reverse implements Cipher {
    do (b: number): number {
        return (((b >> 0) & 1) << 7) |
               (((b >> 1) & 1) << 6) |
               (((b >> 2) & 1) << 5) |
               (((b >> 3) & 1) << 4) |
               (((b >> 4) & 1) << 3) |
               (((b >> 5) & 1) << 2) |
               (((b >> 6) & 1) << 1) |
               (((b >> 7) & 1) << 0) & 0xff;
    }

    undo (b: number): number {
        return this.do(b);
    }
}
