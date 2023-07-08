import {
    LoggerStream,
    MsgCreatePolicy,
    MsgDeletePolicy,
    MsgDialAuth,
    MsgHello,
    MsgOk,
    MsgPolicyResult,
    MsgTargetPopulations,
    ObservedSpecies,
    TargetSpecies,
    newError,
    policyAction
} from './msg';
import { Payload, msgType } from './types';
import { Transform, TransformCallback, TransformOptions } from 'node:stream';
import { FrameReaderStream } from './frame-reader-stream';
import { FrameWriterStream } from './frame-writer-stream';
import { Socket } from 'node:net';
import { log } from '../lib/log';

type State = 'new'| 'handshake'| 'dialed' | 'closed';
type Policies = Record<string, number>; // species -> policy

const waitTimeout = 5000;

export class Authority extends Transform {
    private address: string;
    private port: number;
    private sock: Socket;
    private state: State = 'new';
    private policies: Policies = {};

    constructor (private site: number, options?: TransformOptions) {
        super({ ...options, readableObjectMode: true, writableObjectMode: true });
        this.port = parseInt(process.env.AUTH_PORT || '20547', 10);
        this.address = process.env.AUTH_ADDRESS || 'localhost';

        const connId = `${this.address}:${this.port}`;
        log.info(`authority: connecting to ${connId}`);

        this.sock = new Socket();
        this.sock.connect(this.port, this.address);

        this.sock
            .pipe(new FrameReaderStream())
            .pipe(new LoggerStream(connId, 'auth->'))
            .pipe(this)
            .pipe(new LoggerStream(connId, 'auth<-'))
            .pipe(new FrameWriterStream())
            .pipe(this.sock);

        this.push(new MsgHello().toPayload());
    }

    _transform (data: Payload, _: BufferEncoding, done: TransformCallback) {
        if (data.kind === msgType.error) {
            this.push(data); // pass the error through
            return done();
        }

        if (this.state === 'closed') {
            this.emit('error', new Error('Authority server is closed'));
            return this.push(newError('Authority server is closed'));
        }

        if (this.state === 'new') {
            if (data.kind !== msgType.hello) {
                this.emit('error', new Error('handshake error'));
                return this.push(newError('Rude protocol detected - no hello'));
            }

            try {
                new MsgHello().fromPayload(data);
                this.push(new MsgDialAuth(this.site).toPayload());
                this.state = 'handshake';
                this.emit('handshake');

            } catch (err) {
                this.emit('error', new Error('handshake error'));
                return this.push(newError(<Error>err));
            }

        } else if (this.state === 'handshake') {
            if (data.kind !== msgType.targetPopulations) {
                this.emit('error', new Error('handshake error'));
                return this.push(newError(`dafaq did I just see? ${data.kind}`));
            }

            // handshake complete - dial for the given site.
            try {
                const pops = new MsgTargetPopulations().fromPayload(data);
                this.emit('dialed');
                this.emit('targetPopulations', pops);
                this.state = 'dialed';

            } catch (err) {
                this.emit('error', new Error('handshake error'));
                return this.push(newError(<Error>err));
            }

        } else if (data.kind === msgType.policyResult) {
            // policy has been created.
            try {
                const res = new MsgPolicyResult().fromPayload(data);
                this.emit('createResult', res);

            } catch (err) {
                this.emit('error', new Error('handshake error'));
                return this.push(newError(<Error>err));
            }

        } else if (data.kind === msgType.ok) {
            // policy has been deleted.
            try {
                const res = new MsgOk().fromPayload(data);
                this.emit('deleteResult', res);

            } catch (err) {
                this.emit('error', new Error('handshake error'));
                return this.push(newError(<Error>err));
            }

        } else {
            const err = new Error(`invalid message type: ${data.kind}`);
            this.emit('error', err);
            return this.push(newError(err));
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
            const off = setTimeout(reject, waitTimeout);

            this.once('targetPopulations', (pops: MsgTargetPopulations) => {
                clearTimeout(off);
                resolve(pops);
            });
        });
    }

    // create a policy and wait for the result.
    createPolicy (species: string, action: number) {
        this.push(new MsgCreatePolicy(species, action).toPayload());

        return new Promise<number>((resolve, reject) => {
            const off = setTimeout(reject, waitTimeout);
            this.once('createResult', (res: MsgPolicyResult) => {
                clearTimeout(off);
                this.policies[species] = res.policy;
                return resolve(res.policy);
            });
        });
    }

    // delete a policy and wait for the result.
    deletePolicy (policy: number) {
        this.push(new MsgDeletePolicy(policy).toPayload());

        return new Promise<void>((resolve, reject) => {
            const off = setTimeout(reject, waitTimeout);
            this.once('deleteResult', () => {
                clearTimeout(off);
                delete this.policies[policy];
                return resolve();
            });
        });
    }

    async advisePolicies (observed: ObservedSpecies, target: TargetSpecies) {
        for (const name of Object.keys(observed)) {
            if (this.policies[name]) {
                // delete the policy anyway if it exists.
                await this.deletePolicy(this.policies[name]); // eslint-disable-line no-await-in-loop
            }
        }

        for (const name of Object.keys(observed)) {
            const targetRange = target[name];
            if (!targetRange) {
                continue; // no target for the species - no advice.
            }

            const count = observed[name] || 0;

            if (count < targetRange.min) {
                log.info(`site: ${this.site}, species:${name}, advice:conserve`);
                await this.createPolicy(name, policyAction.conserve); // eslint-disable-line no-await-in-loop
            } else if (count > targetRange.max) {
                log.info(`site: ${this.site}, species:${name}, advice:cull`);
                await this.createPolicy(name, policyAction.cull); // eslint-disable-line no-await-in-loop
            } else {
                log.info(`site: ${this.site}, species:${name}, advice:none`);
            }
        }
    }

    close () {
        this.sock.destroy();
    }
}
