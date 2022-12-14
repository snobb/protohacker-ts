import * as assert from 'node:assert';
import { Xor } from './xor';

describe('xor', () => {
    context('do-undo', () => {
        it('should xor to a full byte', () => {
            const xor = new Xor(255);
            assert.equal(255, xor.do(0));
            assert.equal(0, xor.undo(255));
        });

        it('should xor to zero', () => {
            const xor = new Xor(0);
            assert.equal(255, xor.do(255));
            assert.equal(255, xor.undo(255));
        });

        it('should convert byte', () => {
            const xor = new Xor(0b10101010);
            assert.equal(0b11111111, xor.do(0b1010101));
            assert.equal(0b1010101, xor.undo(0b11111111));
        });

        it('should wrap around correctly', () => {
            const xor = new Xor(255);
            assert.equal(0b1111111, xor.do(0b10000000));
            assert.equal(0b10000000, xor.undo(0b1111111));
        });
    });
});
