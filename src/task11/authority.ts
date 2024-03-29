import {
    FrameReaderStream,
    FrameWriterStream,
    LoggerStream,
    MsgCreatePolicy,
    MsgDeletePolicy,
    MsgDialAuth,
    MsgError,
    MsgHello,
    MsgOk,
    MsgPolicyResult,
    MsgTargetPopulations,
    ObservedSpecies,
    Payload,
    TargetSpecies,
    msgType,
    policyAction
} from './msg';
import { Transform, TransformCallback, TransformOptions } from 'node:stream';
import { Socket } from 'node:net';
import { asyncForEach } from '../lib/tools';
import { log } from '../lib/log';

type PolicyRecord = {
    policy: number,
    action?: number,
};
type Policies = Record<string, PolicyRecord>; // species -> policy
type QueueAction = ()=> Promise<void>;

const waitTimeout = 120 * 1000; // 2 minutes

/**
 * Authority connection - created per site
 * Once initialised, the site CANNOT and MUST NOT be changed
 */
export class Authority extends Transform {
    private address: string;
    private port: number;
    private sock: Socket;
    private expect: number = msgType.hello;
    private populations?: MsgTargetPopulations;
    private policies: Policies = {};
    private actionQueue: QueueAction[] = [];
    public locked = false;

    constructor (private site: number, options?: TransformOptions) {
        super({ ...options, readableObjectMode: true, writableObjectMode: true });
        this.port = parseInt(process.env.AUTH_PORT || '20547', 10);
        this.address = process.env.AUTH_ADDRESS || 'localhost';

        const connId = `${this.address}:${this.port}`;
        log.info(`authority: connecting to ${connId}`);

        this.sock = new Socket();
        this.connect();

        this.sock
            .on('error', (err) => {
                this.push(new MsgError(err).toPayload());
            })
            .pipe(new FrameReaderStream())
            .pipe(new LoggerStream(connId, 'auth->'))
            .pipe(this)
            .pipe(new LoggerStream(connId, 'auth<-'))
            .pipe(new FrameWriterStream())
            .pipe(this.sock);

        const reconnect = () => {
            log.info(`authority: re-connecting to ${connId}`);
            this.expect = msgType.hello;
            this.connect();
        };

        this.sock.on('close', reconnect);
        this.sock.on('timeout', reconnect);

        this.on('error', (err: Error) => {
            log.error(`error authority: ${err}`);
            this.push(new MsgError(err).toPayload());
        });
    }

    connect () {
        this.sock.connect(this.port, this.address);
        this.push(new MsgHello().toPayload());
    }

    _transform (data: Payload, _: BufferEncoding, done: TransformCallback) {
        if (data.kind === msgType.error) {
            this.push(data); // pass the error through
            return done();
        }

        if (this.sock.closed) {
            return this.emit('error', new Error('Authority server is closed'));
        }

        if (this.expect === msgType.hello) {
            if (data.kind !== msgType.hello) {
                return this.emit('error', new Error('Rude protocol detected - no hello'));
            }

            try {
                new MsgHello().fromPayload(data); // validate incoming message
                this.push(new MsgDialAuth(this.site).toPayload());
                this.expect = msgType.targetPopulations;
                this.emit('handshake');

            } catch (err) {
                return this.emit('handshake error', err);
            }

        } else if (this.expect === msgType.targetPopulations) {
            if (data.kind !== msgType.targetPopulations) {
                return this.emit('error', new Error(`dafaq did I just see? ${data.kind}`));
            }

            // handshake complete - dial for the given site.
            try {
                const pops = new MsgTargetPopulations().fromPayload(data);
                this.emit('targetPopulations', pops);
                this.expect = msgType.undef;

            } catch (err) {
                return this.emit('targetPopulations error', err);

            } finally {
                this.sock.pause(); // pausing and wait for policy create/delete calls
            }

        } else if (data.kind === msgType.policyResult) {
            // policy create response
            try {
                const res = new MsgPolicyResult().fromPayload(data);
                this.emit('createResult', res);

            } catch (err) {
                return this.emit('create result error', err);
            }

        } else if (data.kind === msgType.ok) {
            // policy deleted response
            try {
                const res = new MsgOk().fromPayload(data);
                this.emit('deleteResult', res);

            } catch (err) {
                return this.emit('delete result error', err);
            }

        } else {
            return this.emit('error', new Error(`invalid message type: ${data.kind}`));
        }

        done();
    }

    /**
     * Wait until the following:
     * - connection is ready
     * - dial to authority
     * - get and return target populations data.
     */
    getTargetPopulations () {
        return new Promise<MsgTargetPopulations>((resolve, reject) => {
            if (this.populations) {
                return resolve(this.populations);
            }

            const off = setTimeout(() => reject(new Error('target populations timeout')),
                waitTimeout);

            this.once('targetPopulations', (pops: MsgTargetPopulations) => {
                clearTimeout(off);
                this.populations = pops;
                resolve(pops);
            });
        });
    }

    /**
     * create a policy and wait for the result.
     */
    createPolicy (species: string, action: number) {
        return new Promise((resolve, reject) => {
            this.actionQueue.push(() => this.createSinglePolicy(species, action)
                .then(resolve)
                .catch(reject));

            return this.processQueue();
        });
    }

    /**
     * delete a policy and wait for the result.
     */
    deletePolicy (species: string, policy: number) {
        return new Promise((resolve, reject) => {
            this.actionQueue.push(() => this.deleteSinglePolicy(species, policy)
                .then(resolve)
                .catch(reject));

            return this.processQueue();
        });
    }

    /**
     * processQueue - in order to avoid races, the the policy create/delete actions must be
     * processed serially. A queue is used to process the actions in the same order as they
     * arrive.
     */
    async processQueue (): Promise<void> {
        if (this.actionQueue.length === 0) {
            return;
        }

        const action = this.actionQueue.shift();
        if (action) {
            await action();
        }

        return this.processQueue();
    }

    /**
     * create a single polciy policy and wait for the result.
     */
    createSinglePolicy (species: string, action: number) {
        this.push(new MsgCreatePolicy(species, action).toPayload());
        this.sock.resume();

        let off: NodeJS.Timeout;

        return new Promise<number>((resolve, reject) => {
            const cb = (res: MsgPolicyResult) => {
                clearTimeout(off);
                this.sock.pause();
                this.policies[species] = { policy: res.policy, action };
                return resolve(res.policy);
            };

            off = setTimeout(() => {
                reject(new Error('create policy timeout'));
                this.removeListener('createResult', cb);
            }, waitTimeout);

            log.info(`createPolicy: site:${this.site}, species:${species}, action:${action}`);
            this.once('createResult', cb);
        });
    }

    /**
     * delete a policy and wait for the result.
     */
    deleteSinglePolicy (species: string, policy: number) {
        this.push(new MsgDeletePolicy(policy).toPayload());
        this.sock.resume();

        let off: NodeJS.Timeout;

        return new Promise<void>((resolve, reject) => {
            delete this.policies[species];

            const cb = () => {
                clearTimeout(off);
                this.sock.pause();
                return resolve();
            };

            off = setTimeout(() => reject(new Error('delete policy timeout')),
                waitTimeout);

            log.info(`deletePolicy: site:${this.site}, species:${species}, policyNumber:${policy}`);
            this.once('deleteResult', cb);
        });
    }

    /**
     * compare observed and target populations and issue policies per species.
     */
    advisePolicies (observed: ObservedSpecies, target: TargetSpecies) {
        this.locked = true;
        const done = () => {
            this.locked = false;
            this.emit('unlock', this);
        };

        return asyncForEach(Object.keys(target), done, async (species: string, next: ()=> void) => {
            const count = observed[species] || 0;
            const targetRange = target[species];

            const rec = this.policies[species];

            if (count < targetRange.min) {
                if (!rec) {
                    log.info(`advisePolicy: site:${this.site}, species:${species}, advice:conserve`);
                    await this.createPolicy(species, policyAction.conserve);
                } else if (rec.action !== policyAction.conserve) {
                    log.info(`advisePolicy: site:${this.site}, species:${species}, advice:conserve`);
                    await this.deletePolicy(species, rec.policy);
                    await this.createPolicy(species, policyAction.conserve);
                }

            } else if (count > targetRange.max) {
                if (!rec) {
                    log.info(`advisePolicy: site:${this.site}, species:${species}, advice:cull`);
                    await this.createPolicy(species, policyAction.cull);
                } else if (rec.action !== policyAction.cull) {
                    log.info(`advisePolicy: site:${this.site}, species:${species}, advice:cull`);
                    await this.deletePolicy(species, rec.policy);
                    await this.createPolicy(species, policyAction.cull);
                }

            } else {
                log.info(`advisePolicy: site:${this.site}, species:${species}, advice:none`);
                if (rec) {
                    await this.deletePolicy(species, rec.policy);
                }
            }

            return next();
        });
    }

    /**
     * close the authority socket
     */
    close () {
        this.sock.destroy();
    }
}
