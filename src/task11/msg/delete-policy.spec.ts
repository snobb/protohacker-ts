import * as assert from 'node:assert';
import { MsgDeletePolicy } from './delete-policy';
import { msgType } from '.';

describe('delete-policy message', () => {
    it('should parse a message', () => {
        const payload = Buffer.from([
            0x00, 0x00, 0x00, 0x7b, //   policy: 123
        ]);

        const hello = new MsgDeletePolicy(0).fromPayload({ kind: msgType.deletePolicy, payload });
        assert.strictEqual(hello.kind, msgType.deletePolicy);
        assert.strictEqual(hello.policy, 123);
    });

    it('should encode a message', () => {
        const payload = Buffer.from([
            0x00, 0x00, 0x00, 0x7b, //   policy: 123
        ]);

        const dial = new MsgDeletePolicy(123);
        assert.deepEqual(dial.toPayload(), { kind: msgType.deletePolicy, payload });
    });
});
