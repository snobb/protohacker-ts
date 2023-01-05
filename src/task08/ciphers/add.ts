import { Cipher } from './index';

// Add
// add(N): Add N to the byte, modulo 256. Note that 0 is a valid value for N, and addition
// wraps, so that 255+1=0, 255+2=1, and so on.
export class Add implements Cipher {
    private n: number;
    constructor (n: number) {
        this.n = (n & 0xff);
    }

    do (b: number): number {
        return (b + this.n) % 256;
    }

    undo (b: number): number {
        return Math.abs(256 + b - this.n) % 256;
    }
}
