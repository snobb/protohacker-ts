import * as assert from 'node:assert';
import { MsgDialAuth } from './dial-auth';
import { msgType } from '../types';

describe('dial-auth message', () => {
    it('should parse a message', () => {
        const payload = Buffer.from([
            0x00, 0x00, 0x00, 0x7b, //  site: 123
        ]);

        const hello = new MsgDialAuth(0).fromPayload({ kind: msgType.dialAuth, payload });
        assert.strictEqual(hello.kind, msgType.dialAuth);
        assert.strictEqual(hello.site, 123);
    });

    it('should encode a message', () => {
        const payload = Buffer.from([
            0x00, 0x00, 0x30, 0x39, //   site: 12345
        ]);

        const dial = new MsgDialAuth(12345);
        assert.deepEqual(dial.toPayload(), { kind: msgType.dialAuth, payload });
    });
});
