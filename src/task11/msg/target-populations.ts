import { Payload, msgType } from '../types';
import { Decodable } from './index';

export type SpeciesRange = {
    min: number;
    max: number;
}

export type TargetSpecies = Record<string, SpeciesRange>

export class MsgTargetPopulations implements Decodable {
    kind = msgType.targetPopulations;
    site = -1;
    populations: TargetSpecies = {};

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

            this.populations[name] = { min, max };
        }

        return this;
    }
}
