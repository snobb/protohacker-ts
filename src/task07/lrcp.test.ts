import * as assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import { LRCP } from './lrcp';

describe('LRCP', () => {
    describe('getMessage', () => {
        let lrcp: LRCP;
        before(() => {
            lrcp = new LRCP();
        });

        after(() => lrcp.close());

        describe('sanity checks', () => {
            it('should throw if message is empty', () => {
                assert.throws(() => lrcp.getMessage(''));
            });

            it('should throw if message does not have type', () => {
                assert.throws(() => lrcp.getMessage('//'));
            });

            it('should throw if message does not have sid', () => {
                assert.throws(() => lrcp.getMessage('/connect/'));
            });

            it('should throw if message does not have a trailing slash', () => {
                assert.throws(() => lrcp.getMessage('/connect/1234'));
            });

            it('should throw if the data has more then 4 fields', () => {
                assert.throws(() => lrcp.getMessage('/data/123/12345/foobar/test/'));
            });
        });

        describe('2 tokens', () => {
            it('should parse a CONNECT message correctly', () => {
                const msg = lrcp.getMessage('/connect/123/');

                assert.strictEqual(msg.type, 'connect');
                assert.strictEqual(msg.sid, 123);
                assert.ok(!msg.pos);
                assert.ok(!msg.data);
            });

            it('should throw if sid is not numeric', () => {
                assert.throws(() => lrcp.getMessage('/connect/foobar/'));
            });

            it('should throw if sid is lower then minSID', () => {
                assert.throws(() => lrcp.getMessage('/connect/-1/'));
            });

            it('should throw if sid is higher then maxSID', () => {
                assert.throws(() => lrcp.getMessage('/connect/2999999999/'));
            });

            it('should throw if message is not surrounded by backslashes', () => {
                assert.throws(() => lrcp.getMessage('/connect/2999999999/'));
            });

        });

        describe('3 tokens', () => {
            it('should parse a ACK message correctly', () => {
                const msg = lrcp.getMessage('/ack/123/12345/');

                assert.strictEqual(msg.type, 'ack');
                assert.strictEqual(msg.sid, 123);
                assert.strictEqual(msg.pos, 12345);
                assert.ok(!msg.data);
            });

            it('should throw if the position is not numeric', () => {
                assert.throws(() => lrcp.getMessage('/ack/123/foobar/'));
            });
        });

        describe('4 tokens', () => {
            it('should parse a DATA message correctly', () => {
                const msg = lrcp.getMessage('/data/123/12345/foobar/');

                assert.strictEqual(msg.type, 'data');
                assert.strictEqual(msg.sid, 123);
                assert.strictEqual(msg.pos, 12345);
                assert.deepStrictEqual(msg.data, Buffer.from('foobar'));
            });

            it('should NOT throw if the data has escaped slash', () => {
                const msg = lrcp.getMessage('/data/123/12345/foo\\/bar/');

                assert.strictEqual(msg.type, 'data');
                assert.strictEqual(msg.sid, 123);
                assert.strictEqual(msg.pos, 12345);
                assert.deepStrictEqual(msg.data, Buffer.from('foo\\/bar'));
            });
        });
    });
});
