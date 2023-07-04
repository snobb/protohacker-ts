import * as assert from 'node:assert';
import { MsgError } from './error';
import { msgType } from '../types';

describe('error message', () => {
    it('should parse a message', () => {
        const payload = Buffer.from([
            0x00, 0x00, 0x00, 0x03, //   message: (length 3)
            0x62, 0x61, 0x64, //         "bad",
        ]);

        const err = new MsgError('new').fromPayload({ kind: msgType.error, payload });
        assert.strictEqual(err.kind, msgType.error);
        assert.strictEqual(err.message, 'bad');
    });

    it('should encode a message', () => {
        const payload = Buffer.from([
            0x00, 0x00, 0x00, 0x03, //   message: (length 3)
            0x62, 0x61, 0x64, //         "bad",
        ]);

        const err = new MsgError('bad');
        assert.deepEqual(err.toPayload(), { kind: msgType.error, payload });
    });
});
