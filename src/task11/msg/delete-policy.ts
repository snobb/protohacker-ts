import { Payload, msgType } from '../types';
import { Encodable } from './index';

export class MsgDeletePolicy implements Encodable {
    kind = msgType.dialAuth;

    constructor (public policy: number) {}

    toPayload (): Payload {
        const buf = Buffer.alloc(4);
        buf.writeUInt32BE(this.policy);

        return {
            kind: this.kind,
            payload: buf
        };
    }
}
