import * as assert from 'node:assert';
import { Reverse } from './reverse';

describe('reverse', () => {
    context('do', () => {
        it('should reverse 0 to zero', () => {
            const rev = new Reverse();
            assert.equal(0, rev.do(0));
            assert.equal(0, rev.undo(0));
        });

        it('should reverse 255 to 255', () => {
            const rev = new Reverse();
            assert.equal(255, rev.do(255));
            assert.equal(255, rev.undo(255));
        });

        it('should reverse 1 to 128', () => {
            const rev = new Reverse();
            assert.equal(128, rev.do(1));
            assert.equal(1, rev.undo(128));
        });

        it('should reverse 2 to 64', () => {
            const rev = new Reverse();
            assert.equal(64, rev.do(2));
            assert.equal(2, rev.undo(64));
        });

        it('should reverse 3 to 64 + 128', () => {
            const rev = new Reverse();
            assert.equal(64 + 128, rev.do(3));
            assert.equal(3, rev.undo(64 + 128));
        });
    });
});
