import * as assert from 'node:assert';
import { beforeEach, describe, it } from 'node:test';
import { AppStream } from './app';

describe('app-transform', () => {
    let app: AppStream;

    beforeEach(() => {
        app = new AppStream();
    });

    it('should return the biggest value in the list', (_, done) => {
        app.end('1x of foo,15x of bar,7x of baz\n');
        app.on('data', (buf) => {
            assert.equal(buf.toString(), '15x of bar\n');
            done();
        });
    });

    it('should return the biggest value in the list and ignore invalid lines', (_, done) => {
        app.end('1x of foo,barbaz,15x of bar,7x of baz,foobar\n');
        app.on('data', (buf) => {
            assert.equal(buf.toString(), '15x of bar\n');
            done();
        });
    });

    it('should process multiple lines correctly', (_, done) => {
        const exp = [
            '7x of aaa\n',
            '15x of eee\n'
        ];
        app.write('7x of aaa,3x of bbb,5x of ccc\n');
        app.end('1x of ddd,15x of eee,7x of fff\n');
        app.on('data', (buf) => {
            assert.equal(buf.toString(), exp.shift());

            if (exp.length === 0) {
                done();
            }
        });
    });
});
