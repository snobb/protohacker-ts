import { Payload, msgType } from '../types';
import { Encodable } from './index';

export class MsgDialAuth implements Encodable {
    kind = msgType.dialAuth;

    constructor (public site: number) {}

    toPayload (): Payload {
        const buf = Buffer.alloc(4);
        buf.writeUInt32BE(this.site);

        return {
            kind: this.kind,
            payload: buf
        };
    }
}
