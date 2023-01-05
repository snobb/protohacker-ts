import { Cipher } from './index';

// Xor
// xor(N): XOR the byte by the value N. Note that 0 is a valid value for N.
export class Xor implements Cipher {
    private n: number;
    constructor (n: number) {
        this.n = (n & 0xff);
    }

    do (b: number): number {
        return (b & 0xff) ^ this.n;
    }

    undo (b: number): number {
        return this.do(b);
    }
}
