import { Payload, msgType } from './types';
import { Transform, TransformCallback, TransformOptions } from 'node:stream';
import { MsgError } from './msg';

export class PestControl extends Transform {
    private handshake = false;

    constructor (options?: TransformOptions) {
        super({ ...options, readableObjectMode: true, writableObjectMode: true });

        this.push({
            kind: msgType.hello,
            payload: Buffer.from([
                0x00, 0x00, 0x00, 0x0b, // protocol: (length 11)
                0x70, 0x65, 0x73, 0x74, //  "pest
                0x63, 0x6f, 0x6e, 0x74, //   cont
                0x72, 0x6f, 0x6c, //         rol"
                0x00, 0x00, 0x00, 0x01 //  version: 1
            ])
        });
    }

    _transform (data: Payload, _: BufferEncoding, done: TransformCallback) {
        if (data.kind === msgType.error) {
            this.push(data); // pass the error through
            return done();
        }

        if (!this.handshake) {
            if (data.kind !== msgType.hello) {
                this.push(new MsgError('Rude protocol detected - no hello').toPayload());
                this.emit('error', new Error('handshake error'));
                return;
            }

            // TODO: validate hello
            this.handshake = true;
        }

        if (data.kind === msgType.siteVisit) {
        } else {
            // todo send the error down.
        }

        done();
    }
}
