import * as assert from 'node:assert';
import { describe, test, beforeEach } from 'node:test';
import { LineBufStream } from './line-buf-stream';

describe('streams', () => {
    describe('LineBufStream', () => {
        let stream: LineBufStream;

        beforeEach(() => {
            stream = new LineBufStream({ highWaterMark: 10 });
        });

        test('should get 2 lines', async () => {
            const exp = ['foobar\n', 'barbaz\n'];
            stream.write('foobar\n');
            stream.end('barbaz\n');

            const loop = async (i: number) => {
                if (i >= exp.length) {
                    return;
                }

                const res: Buffer = await stream.readLine();
                assert.strictEqual(res.toString(), exp[i]);
                setImmediate(() => loop(i + 1));
            };
            await loop(0);
        });

        test('should get 2 lines split sent in different timeline', async () => {
            const exp = ['foobar\n', 'barbaz\n'];
            const loop = async (i: number) => {
                if (i >= exp.length) {
                    return;
                }

                const res: Buffer = await stream.readLine();
                assert.strictEqual(res.toString(), exp[i]);
                setImmediate(() => loop(i + 1));
            };

            stream.write('foo');
            const p = loop(0);
            stream.write('bar\n');
            stream.end('barbaz\n');

            await p;
        });
    });
});
