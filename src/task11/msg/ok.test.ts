import * as assert from 'node:assert';
import { describe, test } from 'node:test';
import { MsgOk } from './ok';
import { msgType } from '.';

describe('ok message', () => {
    test('should encode a message', () => {
        const payload = Buffer.from([]);

        assert.doesNotThrow(() => new MsgOk().fromPayload({ kind: msgType.ok, payload }));
    });
});
