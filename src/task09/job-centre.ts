import { Job, NamedPQueue } from './namedpq';
import { Transform, TransformCallback, TransformOptions } from 'node:stream';
import { Socket } from 'node:net';

/* eslint-disable no-console */

type WaitCallback = (job: Job)=> void;

type Meta = Record<string, unknown>

type Request = {
    id?: number
    request: string
    queues?: string[]
    queue?: string
    wait?: boolean
    pri?: number
    job?: unknown
}

const nextId = (() => {
    let base = 0;
    return () => {
        base += 1;
        return base;
    };
})();

const debug = process.env.DEBUG;

const running = new Set<number>();
const waiting = new Map<string, WaitCallback[]>();
const store = new NamedPQueue();

export class JobCentreStream extends Transform {
    private working = new Map<number, Job>();
    private clientInfo: string;

    constructor (private conn: Socket, opts?: TransformOptions) {
        super({ ...opts });
        this.on('start-job', (job: Job) => {
            this.debug('start-job', job);
            running.add(job.id);
            this.working.set(job.id, job);
        });

        this.on('finish-job', (job: Job) => {
            this.debug('finish-job', job);
            running.delete(job.id);
            this.working.delete(job.id);
        });

        this.on('close', () => this.close());
        this.on('error', (err: Error) => this.debug('error', {
            error: err.message
        }));

        this.clientInfo = `::${this.conn.remotePort}`;
    }

    _transform (chunk: Buffer, _: BufferEncoding, done: TransformCallback) {
        try {
            const payload = JSON.parse(chunk.toString());
            this.debug('request', payload);
            this.process(payload);

        } catch (err) {
            this.log('error', {
                message: (<Error>err).message,
                stack: (<Error>err).stack
            });

            this.statusError(<Error>err);
            this.conn.destroy();
            this.destroy();

        } finally {
            done();
        }
    }

    process (req: Request) {
        switch (req.request) {
        case 'put': {
            if (!req.job) {
                throw new Error('invalid put request - job field missing');
            }

            if (req.pri === undefined) {
                throw new Error('invalid put request - pri field missing');
            }

            if (!req.queue) {
                throw new Error('invalid put request - queue field missing');
            }

            const job = {
                id: nextId(),
                queue: req.queue,
                priority: req.pri,
                body: req.job,
            };

            if (!this.notifyWaiting(job)) {
                store.enque(job);
            }

            this.statusOk({ id: job.id });

            break;
        }

        case 'get': {
            if (req.queues === undefined || req.queues.length === 0) {
                throw new Error('invalid get request - queues field missing');
            }

            const job = store.deque(req.queues);
            if (job) {
                this.emit('start-job', job);
                this.statusOk({
                    id: job.id,
                    pri: job.priority,
                    queue: job.queue,
                    job: job.body
                });

                break;
            }

            if (req.wait) {
                this.subscribeWaiting(req.queues);
            } else {
                this.statusNoJob({ id: req.id });
            }

            break;
        }

        case 'delete':
            if (req.id === undefined) {
                throw new Error('invalid request - id field missing');
            }

            if (this.working.has(req.id)) {
                // can only finish jobs for current client
                this.emit('finish-job', { id: req.id });
                this.statusOk({ id: req.id });
                break;
            }

            if (store.delete(req.id)) {
                this.statusOk({ id: req.id });
            } else {
                this.statusNoJob({ id: req.id });
            }

            break;

        case 'abort':
            if (req.id === undefined) {
                throw new Error('invalid request - id field missing');
            }

            if (this.abortJob(req.id)) {
                this.statusOk({ id: req.id });
            } else {
                this.statusNoJob({ id: req.id });
            }

            break;

        default:
            throw new Error(`unrecognised requset type: ${req.request}`);
        }
    }

    subscribeWaiting (queues: string[]) {
        for (const queue of queues) {
            const cb = (jb: Job) => {
                this.debug('notify', { job: jb });
                this.emit('start-job', jb);
                this.statusOk({
                    id: jb.id,
                    pri: jb.priority,
                    queue: jb.queue,
                    job: jb.body
                });
            };

            waiting.set(queue, [...(waiting.get(queue) || []), cb]);
        }
    }

    notifyWaiting (job: Job) {
        const clientFn = waiting.get(job.queue)?.shift();
        if (!clientFn) {
            return false;
        }

        clientFn(job);
        return true;
    }

    abortJob (id: number) {
        const job = this.working.get(id);
        if (!job) {
            return false;
        }

        this.emit('finish-job', job);
        if (!this.notifyWaiting(job)) {
            store.enque(job);
        }

        return true;
    }

    statusOk (meta?: Meta) {
        this.debug('response', { status: 'ok', ...meta });
        this.push(JSON.stringify({ status: 'ok', ...meta }));
    }

    statusNoJob (meta?: Meta) {
        this.debug('response', { status: 'no-job', ...meta });
        this.push(JSON.stringify({ status: 'no-job', ...meta }));
    }

    statusError (err: Error, meta?: Meta) {
        this.log('error', {
            status: 'error',
            error: err.message,
            ...meta
        });

        this.push(JSON.stringify({
            status: 'error',
            error: err.message,
            ...meta
        }));
    }

    close () {
        for (const id of this.working.keys()) {
            this.debug('close', { id });
            this.abortJob(id);
        }
    }

    log (pfx: string, meta?: Meta) {
        console.log(`${this.clientInfo} ${pfx}`, JSON.stringify({
            ...meta
        }));
    }

    debug (pfx: string, meta?: Meta) {
        if (!debug) {
            return;
        }

        console.log(`${this.clientInfo} ${pfx}`, JSON.stringify({
            ...meta
        }));
    }
}
