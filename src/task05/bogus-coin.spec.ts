import * as assert from 'node:assert';
import { BogusCoinTransform } from './bogus-coin';

describe('BogusCoinTransform', () => {
    let stream: BogusCoinTransform;
    const evilAddress = '7YWHMfk9JZe0LM0g1ZauHuiSxhI';

    beforeEach(() => {
        stream = new BogusCoinTransform();
    });

    it('should return unmodified strings if there is no address', (done) => {
        const data = 'hello world foobar\n';
        stream.end(data);
        stream.on('data', (buf) => {
            assert.equal(buf, data);
            done();
        });
    });

    it('should rewrite address if only address is provided', (done) => {
        const data = '7iKDZEwPZSqIvDnHvVN2r0hUWXD5rHX\n';
        stream.end(data);
        stream.on('data', (buf) => {
            assert.equal(buf, `${evilAddress}\n`);
            done();
        });
    });

    it('should rewrite address if address is at the end of the line', (done) => {
        const data = 'hello foobar 7iKDZEwPZSqIvDnHvVN2r0hUWXD5rHX\n';
        stream.end(data);
        stream.on('data', (buf) => {
            assert.equal(buf.toString(), `hello foobar ${evilAddress}\n`);
            done();
        });
    });

    it('should rewrite address if address is at the beginning of the line', (done) => {
        const data = '7iKDZEwPZSqIvDnHvVN2r0hUWXD5rHX hello foobar\n';
        stream.end(data);
        stream.on('data', (buf) => {
            assert.equal(buf, `${evilAddress} hello foobar\n`);
            done();
        });
    });

    it('should rewrite address if address is at the middle of the line', (done) => {
        const data = 'foo bar baz 7iKDZEwPZSqIvDnHvVN2r0hUWXD5rHX hello foobar\n';
        stream.end(data);
        stream.on('data', (buf) => {
            assert.equal(buf, `foo bar baz ${evilAddress} hello foobar\n`);
            done();
        });
    });

    it('should rewrite multiple instances of the address', (done) => {
        const data = 'foo bar baz 7iKDZEwPZSqIvDnHvVN2r0hUWXD5rHX 7iKDZEwPZSqIvDnHvVN2r0hUWXD5rHX hello foobar\n';
        stream.end(data);
        stream.on('data', (buf) => {
            assert.equal(buf, `foo bar baz ${evilAddress} ${evilAddress} hello foobar\n`);
            done();
        });
    });
});
