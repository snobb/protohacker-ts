import { Payload, msgType } from './types';
import { Transform, TransformCallback, TransformOptions } from 'node:stream';

export class PestControl extends Transform {
    constructor (options?: TransformOptions) {
        super({ ...options, readableObjectMode: true, writableObjectMode: true });
    }

    _transform (data: Payload, _: BufferEncoding, done: TransformCallback) {
        if (data.kind === msgType.error) {
            this.push(data); // pass the error through
        } else {
            console.log('PestControl:', data); // eslint-disable-line no-console
        }

        this.push(data); // pass the error through
        done();
    }
}
