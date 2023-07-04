import { Decodable, Encodable } from './index';
import { Payload, msgType } from '../types';

export class MsgError implements Encodable, Decodable {
    kind = msgType.error;

    constructor (public message: string) {}

    toPayload (): Payload {
        const buf = Buffer.alloc(this.message.length + 4);
        const offset = buf.writeUInt32BE(this.message.length);
        Buffer.from(this.message).copy(buf, offset);

        return {
            kind: msgType.error,
            payload: buf
        };
    }

    fromPayload (data: Payload): this {
        if (data.kind !== msgType.error) {
            throw new Error('invalid payload');
        }

        const len = data.payload.readUInt32BE();
        this.message = data.payload.subarray(4, 4 + len).toString();
        return this;
    }
}
