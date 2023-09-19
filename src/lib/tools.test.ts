import * as assert from 'node:assert';
import { describe, it } from 'node:test';
import { asyncForEach } from './tools';

const asyncSum = (...nums: number[]) => new Promise((resolve) => {
    const sum = nums.reduce((acc: number, n: number) => acc + n, 0);
    setTimeout(() => resolve(sum), Math.floor(Math.random() * 100));
});

describe('tools tests', () => {
    describe('asyncForEach function', () => {
        it('should run async loop serially', async () => {
            const data = [1, 2, 3, 4, 5, 6, 7, 8];
            const res: number[] = [];

            await asyncForEach(data, () => undefined, async (item: number, next: ()=> void) => {
                res.push(<number>(await asyncSum(item, item)));
                return next();
            });

            assert.deepStrictEqual(res, [2, 4, 6, 8, 10, 12, 14, 16]);
        });
    });
});
