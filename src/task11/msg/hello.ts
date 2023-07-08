import { Decodable, Encodable } from './index';
import { Payload, msgType } from '../types';

export class MsgHello implements Encodable, Decodable {
    kind = msgType.hello;
    version = 1;
    proto = 'pestcontrol';

    toPayload (): Payload {
        const size = 4 + this.proto.length + 4;
        const buf = Buffer.alloc(size);
        let offset = buf.writeUInt32BE(this.proto.length);
        offset += Buffer.from(this.proto).copy(buf, offset);
        buf.writeUInt32BE(this.version, offset);

        return {
            kind: this.kind,
            payload: buf
        };
    }

    fromPayload (data: Payload): this {
        if (data.kind !== this.kind) {
            throw new Error('invalid payload');
        }

        const len = data.payload.readUInt32BE();
        const proto = data.payload.subarray(4, 4 + len).toString();
        if (proto !== this.proto) {
            throw new Error('invalid hello message - proto');
        }

        const version = data.payload.readUInt32BE(4 + len);
        if (version !== this.version) {
            throw new Error('invalid hello message - version');
        }

        return this;
    }
}
