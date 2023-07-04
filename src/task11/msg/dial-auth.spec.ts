import * as assert from 'node:assert';
import { MsgDialAuth } from './dial-auth';
import { msgType } from '../types';

describe('dial-auth message', () => {
    it('should encode a message', () => {
        const payload = Buffer.from([
            0x00, 0x00, 0x30, 0x39, //   site: 12345
        ]);

        const dial = new MsgDialAuth(12345);
        assert.deepEqual(dial.toPayload(), { kind: msgType.dialAuth, payload });
    });
});
