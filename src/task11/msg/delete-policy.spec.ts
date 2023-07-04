import * as assert from 'node:assert';
import { MsgDeletePolicy } from './delete-policy';
import { msgType } from '../types';

describe('delete-policy message', () => {
    it('should encode a message', () => {
        const payload = Buffer.from([
            0x00, 0x00, 0x00, 0x7b, //   policy: 123
        ]);

        const dial = new MsgDeletePolicy(123);
        assert.deepEqual(dial.toPayload(), { kind: msgType.dialAuth, payload });
    });
});
