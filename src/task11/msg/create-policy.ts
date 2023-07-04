import { Payload, msgType } from '../types';
import { Encodable } from './index';

export const policyAction = {
    cull: 0x90,
    concerve: 0xa0,
};

export class MsgCreatePolicy implements Encodable {
    kind = msgType.createPolicy;

    constructor (public species: string, public action: number) {}

    toPayload (): Payload {
        const buf = Buffer.alloc(this.species.length + 4 + 1);
        let offset = buf.writeUInt32BE(this.species.length);
        offset += Buffer.from(this.species).copy(buf, offset);
        buf.writeUInt8(this.action, offset);

        return {
            kind: msgType.createPolicy,
            payload: buf
        };
    }
}
