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
import { log } from '../lib/log';

type State = 'new'| 'handshake'| 'dialed' | 'closed';
type Policies = Record<string, number>; // species -> policy

const waitTimeout = 120 * 1000; // 1 minute

export class Authority extends Transform {
    private address: string;
    private port: number;
    private sock: Socket;
    private state: State = 'new';
    private populations?: MsgTargetPopulations;
    private policies: Policies = {};

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
            this.state = 'new';
            this.connect();
        };

        this.sock.on('close', reconnect);
        this.sock.on('timeout', reconnect);

        this.on('error', (err: Error) => {
            log.info(`error authority: ${err}`);
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

        if (this.state === 'closed') {
            return this.emit('error', new Error('Authority server is closed'));
        }

        if (this.state === 'new') {
            if (data.kind !== msgType.hello) {
                return this.emit('error', new Error('Rude protocol detected - no hello'));
            }

            try {
                new MsgHello().fromPayload(data); // validate incoming message
                this.push(new MsgDialAuth(this.site).toPayload());
                this.state = 'handshake';
                this.emit('handshake');

            } catch (err) {
                return this.emit('error', err);
            }

        } else if (this.state === 'handshake') {
            if (data.kind !== msgType.targetPopulations) {
                return this.emit('error', new Error(`dafaq did I just see? ${data.kind}`));
            }

            // handshake complete - dial for the given site.
            try {
                const pops = new MsgTargetPopulations().fromPayload(data);
                this.emit('dialed');
                this.emit('targetPopulations', pops);
                this.state = 'dialed';

            } catch (err) {
                return this.emit('error', err);
            }

        } else if (data.kind === msgType.policyResult) {
            // policy has been created.
            try {
                const res = new MsgPolicyResult().fromPayload(data);
                this.emit('createResult', res);

            } catch (err) {
                return this.emit('error', err);
            }

        } else if (data.kind === msgType.ok) {
            // policy has been deleted.
            try {
                const res = new MsgOk().fromPayload(data);
                this.emit('deleteResult', res);

            } catch (err) {
                return this.emit('error', err);
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

    // create a policy and wait for the result.
    createPolicy (species: string, action: number) {
        this.push(new MsgCreatePolicy(species, action).toPayload());

        return new Promise<number>((resolve, reject) => {
            const off = setTimeout(() => reject(new Error('create policy timeout')),
                waitTimeout);

            log.info(`createPolicy: site:${this.site}, species:${species}, action:${action}`);
            this.once('createResult', (res: MsgPolicyResult) => {
                clearTimeout(off);
                this.policies[species] = res.policy;
                log.info(`createPolicy: site:${this.site}, species:${species}, action:${action}, policy:${res.policy}`);
                return resolve(res.policy);
            });
        });
    }

    // delete a policy and wait for the result.
    deletePolicy (policy: number) {
        this.push(new MsgDeletePolicy(policy).toPayload());

        return new Promise<void>((resolve, reject) => {
            const off = setTimeout(() => reject(new Error('delete policy timeout')),
                waitTimeout);

            log.info(`deletePolicy: site:${this.site}, policyNumber:${policy}`);
            this.once('deleteResult', () => {
                clearTimeout(off);
                delete this.policies[policy];
                log.info(`deletePolicy: site:${this.site}, policyNumber:${policy}, ok`);
                return resolve();
            });
        });
    }

    async advisePolicies (observed: ObservedSpecies, target: TargetSpecies) {
        for (const species of Object.keys(target)) {
            const count = observed[species] || 0;
            const targetRange = target[species];

            if (this.policies[species]) {
                // delete the policy anyway if it exists.
                await this.deletePolicy(this.policies[species]); // eslint-disable-line no-await-in-loop
            }

            if (count < targetRange.min) {
                log.info(`advisePolicy: site: ${this.site}, species:${species}, advice:conserve`);
                await this.createPolicy(species, policyAction.conserve); // eslint-disable-line no-await-in-loop
            } else if (count > targetRange.max) {
                log.info(`advisePolicy: site: ${this.site}, species:${species}, advice:cull`);
                await this.createPolicy(species, policyAction.cull); // eslint-disable-line no-await-in-loop
            } else {
                log.info(`advisePolicy: site: ${this.site}, species:${species}, advice:none`);
            }
        }
    }

    close () {
        this.sock.destroy();
        this.state = 'closed';
    }
}
