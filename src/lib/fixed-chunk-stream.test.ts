import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { FixedChunkStream } from './fixed-chunk-stream';

describe('streams', () => {
    describe('FixedChunkStream', () => {
        let stream: FixedChunkStream;

        beforeEach(() => {
            stream = new FixedChunkStream({ size: 5 });
        });

        it('should produce fixed size chunked from the stream', (_, done) => {
            const expSizes = [5];
            stream.end('12345');
            stream.on('data', (buf) => {
                assert.equal(buf.length, expSizes.shift());

                if (expSizes.length === 0) {
                    done();
                }
            });
        });

        it('should produce fixed size chunked from the stream and incomplete one', (_, done) => {
            const expSizes = [5, 4];
            stream.end('123451234');
            stream.on('data', (buf) => {
                assert.equal(buf.length, expSizes.shift());

                if (expSizes.length === 0) {
                    done();
                }
            });
        });

        it('should produce fixed size chunked from the stream that is spoonfeeding', (_, done) => {
            const expSizes = [5, 5, 5];
            stream.on('data', (buf) => {
                assert.equal(buf.length, expSizes.shift());

                if (expSizes.length === 0) {
                    done();
                }
            });

            stream.write('1');
            stream.write('2');
            stream.write('3');
            stream.write('4');
            stream.write('5');
            stream.write('1');
            stream.write('2');
            stream.write('3');
            stream.write('4');
            stream.write('5');
            stream.write('1');
            stream.write('2');
            stream.write('3');
            stream.write('4');
            stream.write('4');
        });

        it('should produce fixed size chunked from the stream even if data less then chunk size', (_, done) => {
            const expSizes = [3];
            stream.end('123');
            stream.on('data', (buf) => {
                assert.equal(buf.length, expSizes.shift());

                if (expSizes.length === 0) {
                    done();
                }
            });
        });
    });
});
