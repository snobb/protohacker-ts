import * as assert from 'node:assert';
import { describe, test } from 'node:test';
import { Add } from './add';

describe('add', () => {
    describe('do', () => {
        test('should add to a byte', () => {
            const add = new Add(5);
            assert.equal(5, add.do(0));
        });

        test('should wrap around correctly', () => {
            const add = new Add(5);
            assert.equal(2, add.do(253));
        });

        test('should wrap around correctly', () => {
            const add = new Add(15);
            assert.equal(9, add.do(250));
        });

        test('should do nothing on N == 0', () => {
            const add = new Add(0);
            assert.equal(250, add.do(250));
        });

        test('should wrap around correctly', () => {
            const add = new Add(255);
            assert.equal(249, add.do(250));
        });
    });

    describe('undo', () => {
        test('should add to a byte', () => {
            const add = new Add(5);
            assert.equal(0, add.undo(5));
        });

        test('should wrap around correctly', () => {
            const add = new Add(5);
            assert.equal(253, add.undo(2));
        });

        test('should wrap around correctly', () => {
            const add = new Add(15);
            assert.equal(250, add.undo(9));
        });

        test('should do nothing on N == 0', () => {
            const add = new Add(0);
            assert.equal(250, add.undo(250));
        });

        test('should wrap around correctly', () => {
            const add = new Add(255);
            assert.equal(250, add.undo(249));
        });
    });
});
