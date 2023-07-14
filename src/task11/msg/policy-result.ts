import { Payload, msgType } from '.';
import { Decodable } from './index';

export class MsgPolicyResult implements Decodable {
    kind = msgType.policyResult;
    policy = -1;

    fromPayload (data: Payload): this {
        if (data.kind !== msgType.policyResult) {
            throw new Error('invalid payload');
        }

        this.policy = data.payload.readUInt32BE();
        return this;
    }
}
