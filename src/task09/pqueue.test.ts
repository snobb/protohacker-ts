import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { PQueue } from './pqueue';

/* eslint-disable no-console */

describe('pqueue', () => {
    let pq: PQueue;

    beforeEach(() => {
        pq = new PQueue();
    });

    describe('enque/deque', () => {
        it('should add jobs in random order and deque in order', () => {
            const input = [1, 7, 15, 3, 87, 101];
            const exp = [...input]
                .sort((a, b) => a - b)
                .reverse();
            assert.equal(exp[0], 101);

            for (const n of input) {
                pq.enque({ id: n, priority: n, queue: 'foobar', body: 1 });
            }

            assert.equal(pq.getSize(), input.length);

            let i: number;
            for (i = 0; pq.getSize() > 0; i += 1) {
                const job = pq.deque();
                if (!job) {
                    assert.fail('empty already?');
                }

                assert.equal(job.priority, exp[i]);
            }

            assert.equal(i, exp.length);
        });
    });

    describe('delete', () => {
        it('should delete a job with given ID from the queue', () => {
            const input = [1, 7, 15, 3, 87, 101];
            const exp = [...input]
                .sort((a, b) => a - b)
                .reverse();
            exp.splice(1, 1);
            assert.equal(exp[0], 101);
            assert.equal(exp[1], 15);

            for (const n of input) {
                pq.enque({ id: n, priority: n, queue: 'foobar', body: 1 });
            }

            assert.equal(pq.getSize(), input.length);

            pq.delete(87);
            assert.equal(pq.getSize(), input.length - 1);

            let i: number;
            for (i = 0; pq.getSize() > 0; i += 1) {
                const job = pq.deque();
                if (!job) {
                    assert.fail('empty already?');
                }

                assert.equal(job.priority, exp[i]);
            }

            assert.equal(i, exp.length);
        });
    });
});
