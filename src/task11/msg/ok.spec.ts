import * as assert from 'node:assert';
import { MsgOk } from './ok';
import { msgType } from '.';

describe('ok message', () => {
    it('should encode a message', () => {
        const payload = Buffer.from([]);

        assert.doesNotThrow(() => new MsgOk().fromPayload({ kind: msgType.ok, payload }));
    });
});
