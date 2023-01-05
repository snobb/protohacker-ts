import * as assert from 'node:assert';
import { Add } from './add';

describe('add', () => {
    context('do', () => {
        it('should add to a byte', () => {
            const add = new Add(5);
            assert.equal(5, add.do(0));
        });

        it('should wrap around correctly', () => {
            const add = new Add(5);
            assert.equal(2, add.do(253));
        });

        it('should wrap around correctly', () => {
            const add = new Add(15);
            assert.equal(9, add.do(250));
        });

        it('should do nothing on N == 0', () => {
            const add = new Add(0);
            assert.equal(250, add.do(250));
        });

        it('should wrap around correctly', () => {
            const add = new Add(255);
            assert.equal(249, add.do(250));
        });
    });

    context('undo', () => {
        it('should add to a byte', () => {
            const add = new Add(5);
            assert.equal(0, add.undo(5));
        });

        it('should wrap around correctly', () => {
            const add = new Add(5);
            assert.equal(253, add.undo(2));
        });

        it('should wrap around correctly', () => {
            const add = new Add(15);
            assert.equal(250, add.undo(9));
        });

        it('should do nothing on N == 0', () => {
            const add = new Add(0);
            assert.equal(250, add.undo(250));
        });

        it('should wrap around correctly', () => {
            const add = new Add(255);
            assert.equal(250, add.undo(249));
        });
    });
});
