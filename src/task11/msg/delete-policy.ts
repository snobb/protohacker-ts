import { Decodable, Encodable } from './index';
import { Payload, msgType } from '../types';

export class MsgDeletePolicy implements Encodable, Decodable {
    kind = msgType.deletePolicy;

    constructor (public policy: number) {}

    toPayload (): Payload {
        const buf = Buffer.alloc(4);
        buf.writeUInt32BE(this.policy);

        return {
            kind: this.kind,
            payload: buf
        };
    }

    fromPayload (data: Payload): this {
        if (data.kind !== this.kind) {
            throw new Error('invalid payload');
        }

        this.policy = data.payload.readUInt32BE();
        return this;
    }

}
