import { Payload, msgType } from '../types';
import { Decodable } from './index';

export type Species = {
    name: string;
    min: number;
    max: number;
}

export class MsgTargetPopulations implements Decodable {
    kind = msgType.targetPopulations;
    site = -1;
    populations: Species[] = [];

    fromPayload (data: Payload): this {
        if (data.kind !== msgType.targetPopulations) {
            throw new Error('invalid payload');
        }

        this.site = data.payload.readUInt32BE();
        let offset = 4;

        const n = data.payload.readUInt32BE(offset);
        offset += 4;

        for (let i = 0; i < n; i += 1) {
            const nameLen = data.payload.readUInt32BE(offset);
            offset += 4;

            const name = data.payload.subarray(offset, offset + nameLen).toString();
            offset += nameLen;

            const min = data.payload.readUInt32BE(offset);
            offset += 4;

            const max = data.payload.readUInt32BE(offset);
            offset += 4;

            this.populations.push({ name, min, max });
        }

        return this;
    }
}
