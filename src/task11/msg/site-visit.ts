import { Payload, msgType } from '../types';
import { Decodable } from './index';

export type ObservedSpecies = {
    name: string;
    count: number;
}

export class MsgSiteVisit implements Decodable {
    kind = msgType.siteVisit;
    site = -1;
    populations: ObservedSpecies[] = [];

    fromPayload (data: Payload): this {
        if (data.kind !== msgType.siteVisit) {
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

            const count = data.payload.readUInt32BE(offset);
            offset += 4;

            this.populations.push({ name, count });
        }

        return this;
    }
}
