import * as assert from 'node:assert';
import { MsgPolicyResult } from './policy-result';
import { msgType } from '.';

describe('policy-result message', () => {
    it('should parse a message', () => {
        const payload = Buffer.from([
            0x00, 0x00, 0x00, 0x7b, //   policy: 123
        ]);

        const obj = new MsgPolicyResult().fromPayload({ kind: msgType.policyResult, payload });
        assert.strictEqual(obj.kind, msgType.policyResult);
        assert.strictEqual(obj.policy, 123);
    });
});
