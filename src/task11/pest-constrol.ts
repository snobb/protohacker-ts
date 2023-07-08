import {
    MsgError,
    MsgHello, MsgSiteVisit,
    newError,
} from './msg';
import { Payload, msgType } from './types';
import { Transform, TransformCallback, TransformOptions } from 'node:stream';
import { Authority } from './authority';
import { log } from '../lib/log';

export class PestControl extends Transform {
    private handshake = false;

    constructor (options?: TransformOptions) {
        super({ ...options, readableObjectMode: true, writableObjectMode: true });
        this.push(new MsgHello().toPayload());
    }

    async _transform (data: Payload, _: BufferEncoding, done: TransformCallback) {
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

            try {
                new MsgHello().fromPayload(data);
                this.handshake = true;

            } catch (err) {
                this.push(newError(<Error>err));
                this.emit('error', new Error('handshake error'));
            }

        } else if (data.kind === msgType.siteVisit) {
            let auth: Authority | undefined;

            try {
                const observed = new MsgSiteVisit().fromPayload(data);
                log.info('pestcontrol: observed populations', JSON.stringify(observed.populations));

                log.info('handling site:', observed.site);
                auth = new Authority(observed.site);
                const target = await auth.getTargetPopulations();
                log.info('pestcontrol: target populations', JSON.stringify(target.populations));

                await auth.advisePolicies(observed.populations, target.populations);

            } catch (err) {
                this.push(newError(<Error>err));
                this.emit('error', new Error('handshake error'));
            } finally {
                if (auth) {
                    auth.destroy();
                }
            }

        } else {
            this.push(newError(`unexpected message ${data.kind}`));
            this.emit('error', new Error(`unexpected message ${data.kind}`));
        }

        done();
    }

}
