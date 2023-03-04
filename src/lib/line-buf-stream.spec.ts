import * as assert from 'node:assert';
import { LineBufStream } from './line-buf-stream';

describe('streams', () => {
    context('LineBufStream', () => {
        let stream: LineBufStream;

        beforeEach(() => {
            stream = new LineBufStream({ highWaterMark: 10 });
        });

        it('should get 2 lines', async () => {
            const exp = ['foobar\n', 'barbaz\n'];
            stream.write('foobar\n');
            stream.end('barbaz\n');

            await (async function loop (i: number) {
                if (i >= exp.length) {
                    return;
                }

                const res: Buffer = await stream.readLine();
                assert.strictEqual(res.toString(), exp[i]);
                setImmediate(() => loop(i + 1));
            })(0);
        });

        it('should get 2 lines split sent in different timeline', async () => {
            const exp = ['foobar\n', 'barbaz\n'];
            async function loop (i: number) {
                if (i >= exp.length) {
                    return;
                }

                const res: Buffer = await stream.readLine();
                assert.strictEqual(res.toString(), exp[i]);
                setImmediate(() => loop(i + 1));
            }

            stream.write('foo');
            const p = loop(0);
            stream.write('bar\n');
            stream.end('barbaz\n');

            await p;
        });

        /*
        it('should split the line into 2 when spoonfed', (done) => {
            const exp = ['foobar\n', 'barbaz\n'];
            for (const ch of 'foobar\nbarbaz\n') {
                stream.write(ch);
            }

            stream.end();

            stream.on('data', (buf) => {
                assert.strictEqual(buf.toString(), exp.shift());

                if (exp.length === 0) {
                    done();
                }
            });
        });

        it('should split the line into 2 empty lines', (done) => {
            const exp = ['\n', '\n'];
            stream.end('\n\n');

            stream.on('data', (buf) => {
                assert.equal(buf.toString(), exp.shift());

                if (exp.length === 0) {
                    done();
                }
            });
        });

        it('should split the line into 2 empty lines split accross multiple buffers', (done) => {
            const exp = ['foo\n', 'bar\n'];
            stream.write('foo\nba');
            stream.end('r\n');

            stream.on('data', (buf) => {
                assert.equal(buf.toString(), exp.shift());

                if (exp.length === 0) {
                    done();
                }
            });
        });
       */
    });
});
