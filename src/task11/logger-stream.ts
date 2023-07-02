import { Transform, TransformCallback, TransformOptions } from 'node:stream';
import { Payload } from './types';
import { log } from '../lib/log';

export class LoggerStream extends Transform {
    constructor (private clientId: string, private pfx: string, opts?: TransformOptions) {
        super({ ...opts, readableObjectMode: true, writableObjectMode: true });
    }

    _transform (data: Payload, _: BufferEncoding, done: TransformCallback) {
        const payloadStr = data.payload.toString('hex').replace(/../g, '$& ');
        log.info(this.clientId, this.pfx, `kind:${data.kind.toString(16)}, payload:${payloadStr}`);
        this.push(data);
        done();
    }
}
