import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { LineStream } from './line-stream';

describe('streams', () => {
    describe('LineStream', () => {
        let stream: LineStream;

        beforeEach(() => {
            stream = new LineStream();
        });

        it('should split the line into 2', (_, done) => {
            const exp = ['foobar\n', 'barbaz\n'];
            stream.end('foobar\nbarbaz\n');
            stream.on('data', (buf) => {
                assert.strictEqual(buf.toString(), exp.shift());

                if (exp.length === 0) {
                    done();
                }
            });
        });

        it('should split the line into 2 when spoonfed', (_, done) => {
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

        it('should split the line into 2 empty lines', (_, done) => {
            const exp = ['\n', '\n'];
            stream.end('\n\n');

            stream.on('data', (buf) => {
                assert.strictEqual(buf.toString(), exp.shift());

                if (exp.length === 0) {
                    done();
                }
            });
        });

        it('should split the line into 2 empty lines split accross multiple buffers', (_, done) => {
            const exp = ['foo\n', 'bar\n'];
            stream.write('foo\nba');
            stream.end('r\n');

            stream.on('data', (buf) => {
                assert.strictEqual(buf.toString(), exp.shift());

                if (exp.length === 0) {
                    done();
                }
            });
        });
    });
});
