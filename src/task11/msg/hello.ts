import { Decodable, Encodable } from './index';
import { Payload, msgType } from '.';

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
        let offset = 4;
        const proto = data.payload.subarray(offset, offset + len).toString();
        offset += len;

        if (proto !== this.proto) {
            throw new Error('invalid hello message - proto');
        }

        const version = data.payload.readUInt32BE(4 + len);
        offset += 4;

        if (data.payload.length > offset) {
            throw new Error('Too much payload');
        }

        if (version !== this.version) {
            throw new Error('invalid hello message - version');
        }

        return this;
    }
}
