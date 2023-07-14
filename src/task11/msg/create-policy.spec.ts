import * as assert from 'node:assert';
import { MsgCreatePolicy, policyAction } from './create-policy';
import { msgType } from '.';

describe('create-policy message', () => {
    it('should parse a message', () => {
        const payload = Buffer.from([
            0x00, 0x00, 0x00, 0x03, //  name: (length 3)
            0x64, 0x6f, 0x67, //        "dog",
            0xa0 //                     action: conserve,
        ]);

        const hello = new MsgCreatePolicy('', 0).fromPayload({ kind: msgType.createPolicy, payload });
        assert.strictEqual(hello.kind, msgType.createPolicy);
        assert.strictEqual(hello.action, policyAction.conserve);
    });

    it('should encode a message', () => {
        const payload = Buffer.from([
            0x00, 0x00, 0x00, 0x03, //  name: (length 3)
            0x64, 0x6f, 0x67, //        "dog",
            0xa0 //                     action: conserve,
        ]);

        const obj = new MsgCreatePolicy('dog', policyAction.conserve);
        assert.deepEqual(obj.toPayload(), { kind: msgType.createPolicy, payload });
    });
});
