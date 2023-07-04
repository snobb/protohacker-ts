import * as assert from 'node:assert';
import { MsgHello } from './hello';

describe('hello message', () => {
    it('should parse a message', () => {
        const payload = Buffer.from([
            0x00, 0x00, 0x00, 0x0b, //  protocol: (length 11)
            0x70, 0x65, 0x73, 0x74, //   "pest
            0x63, 0x6f, 0x6e, 0x74, //    cont
            0x72, 0x6f, 0x6c, //          rol"
            0x00, 0x00, 0x00, 0x01, //  version: 1
        ]);

        const hello = new MsgHello().fromPayload({ kind: 0x50, payload });
        assert.strictEqual(hello.kind, 0x50);
        assert.strictEqual(hello.proto, 'pestcontrol');
    });

    it('should encode a message', () => {
        const payload = Buffer.from([
            0x00, 0x00, 0x00, 0x0b, //  protocol: (length 11)
            0x70, 0x65, 0x73, 0x74, //   "pest
            0x63, 0x6f, 0x6e, 0x74, //    cont
            0x72, 0x6f, 0x6c, //          rol"
            0x00, 0x00, 0x00, 0x01, //  version: 1
        ]);

        const hello = new MsgHello();
        assert.deepEqual(hello.toPayload(), { kind: 0x50, payload });
    });
});
