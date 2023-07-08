import { Decodable, Encodable } from './index';
import { Payload, msgType } from '../types';

export const policyAction = {
    cull: 0x90,
    conserve: 0xa0,
};

export class MsgCreatePolicy implements Encodable, Decodable {
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

    fromPayload (data: Payload): this {
        if (data.kind !== this.kind) {
            throw new Error('invalid payload');
        }

        const len = data.payload.readUInt32BE();
        this.species = data.payload.subarray(4, 4 + len).toString();
        this.action = data.payload.readUInt8(4 + len);
        if (this.action !== policyAction.conserve && this.action !== policyAction.cull) {
            throw new Error(`invalid action: ${this.action}`);
        }

        return this;
    }
}
