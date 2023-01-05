export { Add } from './add';
export { AddPos } from './addpos';
export { Xor } from './xor';
export { XorPos } from './xorpos';
export { Reverse } from './reverse';

export type CipherOpts = {
    pos?: number
}

export interface Cipher {
    do(b: number, pos?: number): number
    undo(b: number, pos?: number): number
}
