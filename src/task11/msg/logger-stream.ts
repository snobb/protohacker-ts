import { Transform, TransformCallback, TransformOptions } from 'node:stream';
import { Payload } from '../types';
import { log } from '../../lib/log';

const kindStr = {
    [0x50.toString()]: 'hello',
    [0x51.toString()]: 'error',
    [0x52.toString()]: 'ok',
    [0x53.toString()]: 'dialAuth',
    [0x54.toString()]: 'targetPopulations',
    [0x55.toString()]: 'createPolicy',
    [0x56.toString()]: 'deletePolicy',
    [0x57.toString()]: 'policyResult',
    [0x58.toString()]: 'siteVisit'
};

export class LoggerStream extends Transform {
    constructor (private clientId: string, private pfx: string, opts?: TransformOptions) {
        super({ ...opts, readableObjectMode: true, writableObjectMode: true });
    }

    _transform (data: Payload, _: BufferEncoding, done: TransformCallback) {
        const payloadStr = data.payload
            ? data.payload
                .toString()
                .replace(/[^\x20-\x7E]+/g, '')
                .substr(0, 30)
            : 'none';
        const sfx = (data.payload && data.payload.length > 10) ? '...' : '';

        log.info(this.clientId, this.pfx,
            `kind:${kindStr[data.kind.toString()]}, payload:${payloadStr}${sfx}`);
        this.push(data);
        done();
    }
}
