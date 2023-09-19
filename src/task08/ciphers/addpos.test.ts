import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import { AddPos } from './addpos';

describe('addpos', () => {
    describe('do', () => {
        it('should add to a byte', () => {
            const add = new AddPos();
            assert.equal(5, add.do(0, 5));
        });

        it('should wrap around correctly', () => {
            const add = new AddPos();
            assert.equal(2, add.do(253, 5));
        });

        it('should wrap around correctly', () => {
            const add = new AddPos();
            assert.equal(9, add.do(250, 15));
        });

        it('should do nothing on N == 0', () => {
            const add = new AddPos();
            assert.equal(250, add.do(250, 0));
        });

        it('should wrap around correctly', () => {
            const add = new AddPos();
            assert.equal(249, add.do(250, 255));
        });
    });

    describe('undo', () => {
        it('should add to a byte', () => {
            const add = new AddPos();
            assert.equal(0, add.undo(5, 5));
        });

        it('should wrap around correctly', () => {
            const add = new AddPos();
            assert.equal(253, add.undo(2, 5));
        });

        it('should wrap around correctly', () => {
            const add = new AddPos();
            assert.equal(250, add.undo(9, 15));
        });

        it('should do nothing on N == 0', () => {
            const add = new AddPos();
            assert.equal(250, add.undo(250, 0));
        });

        it('should wrap around correctly', () => {
            const add = new AddPos();
            assert.equal(250, add.undo(249, 255));
        });
    });
});
