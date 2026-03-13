import * as assert from 'node:assert';
import { describe, test } from 'node:test';
import { Reverse } from './reverse';

describe('reverse', () => {
    describe('do', () => {
        test('should reverse 0 to zero', () => {
            const rev = new Reverse();
            assert.equal(0, rev.do(0));
            assert.equal(0, rev.undo(0));
        });

        test('should reverse 255 to 255', () => {
            const rev = new Reverse();
            assert.equal(255, rev.do(255));
            assert.equal(255, rev.undo(255));
        });

        test('should reverse 1 to 128', () => {
            const rev = new Reverse();
            assert.equal(128, rev.do(1));
            assert.equal(1, rev.undo(128));
        });

        test('should reverse 2 to 64', () => {
            const rev = new Reverse();
            assert.equal(64, rev.do(2));
            assert.equal(2, rev.undo(64));
        });

        test('should reverse 3 to 64 + 128', () => {
            const rev = new Reverse();
            assert.equal(64 + 128, rev.do(3));
            assert.equal(3, rev.undo(64 + 128));
        });
    });
});
