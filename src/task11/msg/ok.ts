import { Payload, msgType } from '.';
import { Decodable } from './index';

export class MsgOk implements Decodable {
    kind = msgType.ok;

    fromPayload (data: Payload): this {
        if (data.kind !== msgType.ok) {
            throw new Error('invalid payload');
        }

        if (data.payload.length !== 0) {
            throw new Error('invalid payload - must be empty');
        }

        return this;
    }
}
