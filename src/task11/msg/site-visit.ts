import { Payload, msgType } from '.';
import { Decodable } from './index';

export type ObservedSpecies = Record<string, number>;

export class MsgSiteVisit implements Decodable {
    kind = msgType.siteVisit;
    site = -1;
    populations: ObservedSpecies = {};

    fromPayload (data: Payload): this {
        if (data.kind !== msgType.siteVisit) {
            throw new Error('invalid payload');
        }

        this.site = data.payload.readUInt32BE();
        let offset = 4;

        const n = data.payload.readUInt32BE(offset);
        offset += 4;

        // population record is at least 8bytes (with empty name), so if sum of all records is
        // bigger than the existing payload, means the message is likely malformed or bogus
        if (n * 8 > data.payload.length) {
            throw new Error('payload size value is bigger than payload itself');
        }

        for (let i = 0; i < n; i += 1) {
            const nameLen = data.payload.readUInt32BE(offset);
            offset += 4;

            const name = data.payload.subarray(offset, offset + nameLen).toString();
            offset += nameLen;

            const count = data.payload.readUInt32BE(offset);
            offset += 4;

            const existing = this.populations[name];
            if (existing && existing !== count) {
                throw new Error(`conflicting counts for ${name} - ${existing} != ${count}`);
            }

            this.populations[name] = count;
        }

        if (data.payload.length > offset) {
            throw new Error('Too much payload');
        }

        return this;
    }
}
