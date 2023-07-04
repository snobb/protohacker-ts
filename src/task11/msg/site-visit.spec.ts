import * as assert from 'node:assert';
import { MsgSiteVisit } from './site-visit';
import { msgType } from '../types';

describe('site-visit message', () => {
    it('should parse a message', () => {
        const payload = Buffer.from([
            0x00, 0x00, 0x30, 0x39, //    site: 12345,
            0x00, 0x00, 0x00, 0x02, //    populations: (length 2) [

            0x00, 0x00, 0x00, 0x03, //        name: (length 3)
            0x64, 0x6f, 0x67, //              "dog",
            0x00, 0x00, 0x00, 0x01, //        count: 1,

            0x00, 0x00, 0x00, 0x03, //        name: (length 3)
            0x72, 0x61, 0x74, //              "rat",
            0x00, 0x00, 0x00, 0x05, //         count: 5,
        ]);

        const obj = new MsgSiteVisit().fromPayload({ kind: msgType.siteVisit, payload });
        assert.strictEqual(obj.kind, msgType.siteVisit);
        assert.strictEqual(obj.site, 12345);
        assert.deepStrictEqual(obj.populations, [
            {
                name: 'dog',
                count: 1,
            },
            {
                name: 'rat',
                count: 5
            },
        ]);
    });
});
