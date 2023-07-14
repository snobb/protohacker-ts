import {
    MsgError,
    MsgHello,
    MsgSiteVisit,
    Payload,
    msgType
} from './msg';
import { Transform, TransformCallback, TransformOptions } from 'node:stream';
import { Authority } from './authority';
import { log } from '../lib/log';

// authority store site(number) -> Authority
const auths = new Map<number, Authority>();

function getAuthority (site: number) {
    let auth = auths.get(site);
    if (!auth) {
        auth = new Authority(site);
        auths.set(site, auth);
    }

    return auth;
}

export class PestControl extends Transform {
    private handshake = false;

    constructor (options?: TransformOptions) {
        super({ ...options, readableObjectMode: true, writableObjectMode: true });
        this.push(new MsgHello().toPayload());

        this.on('error', (err: Error) => {
            log.info(`error: ${err}`);
            this.push(new MsgError(err).toPayload());
        });
    }

    async _transform (data: Payload, _: BufferEncoding, done: TransformCallback) {
        if (data.kind === msgType.error) {
            this.push(data); // pass the error through
            return done();
        }

        if (!this.handshake) {
            if (data.kind !== msgType.hello) {
                this.emit('error', 'rude protocol - no hello');
                return;
            }

            try {
                new MsgHello().fromPayload(data);
                this.handshake = true;

            } catch (err) {
                this.emit('error', err);
            }

        } else if (data.kind === msgType.siteVisit) {
            try {
                const observed = new MsgSiteVisit().fromPayload(data);
                log.info(`pestcontrol: site:${observed.site}, observed populations`,
                    JSON.stringify(observed.populations));

                log.info('handling site:', observed.site);
                const auth = getAuthority(observed.site);
                const target = await auth.getTargetPopulations();
                log.info(`pestcontrol: site:${observed.site}, target populations`,
                    JSON.stringify(target.populations));

                await auth.advisePolicies(observed.populations, target.populations);

            } catch (err) {
                this.emit('error', err);
            }

        } else {
            this.emit('error', new Error(`unexpected message ${data.kind}`));
        }

        done();
    }
}
