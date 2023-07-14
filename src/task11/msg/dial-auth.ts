import { Decodable, Encodable } from './index';
import { Payload, msgType } from '.';

export class MsgDialAuth implements Encodable, Decodable {
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

    fromPayload (data: Payload): this {
        if (data.kind !== this.kind) {
            throw new Error('invalid payload');
        }

        this.site = data.payload.readUInt32BE();
        return this;
    }
}
