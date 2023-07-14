import * as assert from 'node:assert';
import { MsgTargetPopulations } from './target-populations';
import { msgType } from '.';

describe('target-populations message', () => {
    it('should parse a message', () => {
        const payload = Buffer.from([
            0x00, 0x00, 0x30, 0x39, // site: 12345,
            0x00, 0x00, 0x00, 0x02, // populations: (length 2) [

            0x00, 0x00, 0x00, 0x03, //     name: (length 3)
            0x64, 0x6f, 0x67, //           "dog",
            0x00, 0x00, 0x00, 0x01, //     min: 1,
            0x00, 0x00, 0x00, 0x03, //     max: 3,

            0x00, 0x00, 0x00, 0x03, //     name: (length 3)
            0x72, 0x61, 0x74, //           "rat",
            0x00, 0x00, 0x00, 0x00, //     min: 0,
            0x00, 0x00, 0x00, 0x0a, //     max: 10,
        ]);

        const obj = new MsgTargetPopulations().fromPayload({
            kind: msgType.targetPopulations,
            payload
        });

        assert.strictEqual(obj.kind, msgType.targetPopulations);
        assert.strictEqual(obj.site, 12345);
        assert.deepStrictEqual(obj.populations, {
            'dog': {
                min: 1,
                max: 3
            },
            'rat': {
                min: 0,
                max: 10
            },
        });
    });
});
