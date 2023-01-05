import { Duplex, DuplexOptions } from 'node:stream';
import { RemoteInfo, Socket } from '../lib/udp-server';
import { Message } from './lrcp';

/* eslint-disable no-console */

export type DuplexCallback = (error?: Error)=> void;
type Chunk = {
    pos: number,
    data: Buffer,
}

export class Session extends Duplex {
    static readonly sessionTimeout = 60 * 1000;
    static readonly retransmitInterval = 3 * 1000;
    static readonly maxPayloadSize = 800;

    private _isClosed = false;
    private appBuffer = Buffer.alloc(0);
    private blocked = false;
    private reTxTimer?: NodeJS.Timer;

    // receive
    private rcvAcked = 0;
    private rcvLast: number = Date.now();

    // send
    private sendTotal = 0; // total sent bytes.
    private sendAcked = 0; // all the sent data that has been acked.
    private sendChunks: Chunk[] = []; // all the chunks we send

    constructor (private sid: number, private sock: Socket,
                 private rinfo: RemoteInfo, opts?: DuplexOptions) {
        super({ ...opts, writableHighWaterMark: Session.maxPayloadSize * 10 });
        sock.on('close', () => this.close());
    }

    handle (msg: Message) {
        switch (msg.type) {
        case 'connect':
            this.handleConnect(msg);
            break;

        case 'close':
            this.handleClose(msg);
            break;

        case 'ack':
            this.handleAck(msg);
            break;

        case 'data':
            this.handleData(msg);
            break;

        default:
            this.log(`invalid message type: ${msg.type}`);
        }
    }

    handleConnect (msg: Message) {
        this.log(`handling ${msg.type} msg`);
        this.sendAck(0);
    }

    handleClose (msg: Message) {
        this.log(`handling ${msg.type} msg`);
        this.sendClose();
        this.close();
    }

    handleAck (msg: Message) {
        this.log(`handling ${msg.type} msg: pos:${msg.pos}`);
        this.notify();

        if (msg.pos === undefined) {
            this.log('invalid message:', msg);
            return;
        }

        if (msg.pos > this.sendTotal) {
            this.sendClose();
            this.close();

        } else if (msg.pos >= this.sendAcked) {
            this.sendAcked = msg.pos;
        }
    }

    handleData (msg: Message) {
        this.log(`handling ${msg.type} msg: pos:${msg.pos} data:${msg.data?.toString()}`);
        this.notify();

        if (msg.pos === undefined || msg.data === undefined) {
            this.log('invalid message:', msg);
            return;
        }

        if (msg.pos > this.rcvAcked) {
            // do not have all the data - send duplicate ack for data we have.
            this.sendAck(this.rcvAcked);
            this.sendAck(this.rcvAcked);

        } else if (msg.pos < this.rcvAcked && !this.isClosed()) {
            // resend all unacked buffers.
            const chunks: Buffer[] = [];
            this.sendAck(this.rcvAcked);

            for (const { pos, data } of this.sendChunks) {
                if (msg.pos > pos) {
                    if (msg.pos >= pos + data.length) {
                        continue;
                    }

                    const offset = msg.pos - pos;
                    this.debug(`incomplete chunk - ${pos} ${msg.pos} ${data.subarray(offset).toString()}`);
                    chunks.push(data.subarray(offset));

                } else {
                    this.debug(`complete chunk pos:${pos}, data:${data.toString()}`);
                    chunks.push(data);
                }
            }

            if (chunks.length > 0) {
                this.sendData(msg.pos, Buffer.concat(chunks));
            }

        } else {
            // have all data up to pos + the current buffer
            const buf = this.unescape(msg.data);
            this.rcvAcked += buf.length;
            this.sendAck(this.rcvAcked);

            if (this.blocked) {
                this.appBuffer = Buffer.concat([this.appBuffer, buf]);

            } else if (!this.push(buf)) {
                this.blocked = true;
            }
        }
    }

    _read (size: number) {
        while (this.appBuffer.length > 0) {
            if (!this.push(this.appBuffer.subarray(0, size))) {
                break; // blocked
            }

            this.appBuffer = this.appBuffer.subarray(size);
        }

        this.blocked = false;
    }

    async _write (chunk: Buffer, _: BufferEncoding, done: DuplexCallback) {
        await this.sendData(this.sendTotal, chunk);
        this.sendChunks.push({ pos: this.sendTotal, data: chunk }); // save chunk for retransmits.
        this.sendTotal += chunk.length;

        this.startRetransmit();
        done();
    }

    startRetransmit () {
        if (this.reTxTimer) {
            return;
        }

        const resend = async () => {
            if (this.sendChunks.length === 0 ||
                    this.sendAcked === this.sendTotal || this.isClosed()) {
                this.reTxTimer = undefined;
                return;
            }

            const chunks: Buffer[] = [];

            for (const { pos, data } of this.sendChunks) {
                if (this.sendAcked >= pos + data.length) {
                    continue; // already acked.
                }

                if (pos < this.sendAcked) {
                    chunks.push(data.subarray(this.sendAcked - pos));

                } else {
                    chunks.push(data);
                }
            }

            const buf = Buffer.concat(chunks);
            this.debug(`rtx: pos:${this.sendAcked} data: ${JSON.stringify(buf.toString())}`);
            await this.sendData(this.sendAcked, buf);

            this.reTxTimer = setTimeout(resend, Session.retransmitInterval);
        };

        this.reTxTimer = setTimeout(resend, Session.retransmitInterval);
    }

    escape (buf: Buffer) {
        const chunks: Buffer[] = [];

        let lo = 0;
        for (let hi = 0; hi < buf.length; hi += 1) {
            if (buf[hi] === '\\'.charCodeAt(0)) {
                chunks.push(buf.subarray(lo, hi), Buffer.from('\\\\'));
                lo = hi + 1;

            } else if (buf[hi] === '/'.charCodeAt(0)) {
                chunks.push(buf.subarray(lo, hi), Buffer.from('\\/'));
                lo = hi + 1;
            }
        }

        chunks.push(buf.subarray(lo));
        return Buffer.concat(chunks);
    }

    unescape (buf: Buffer) {
        return Buffer.from(buf
            .toString()
            .replaceAll('\\/', '/')
            .replaceAll('\\\\', '\\'));
    }

    isClosed () {
        return this._isClosed;
    }

    hasExpired () {
        return Date.now() - this.rcvLast > Session.sessionTimeout;
    }

    close () {
        this._isClosed = true;
        this.rcvLast = 0;

        if (this.reTxTimer) {
            clearTimeout(this.reTxTimer);
        }
    }

    notify () {
        this.rcvLast = Date.now();
    }

    sendClose () {
        this.debug('send close');
        this.sock.send(`/close/${this.sid}/`, this.rinfo.port, this.rinfo.address);
    }

    sendAck (pos: number) {
        this.debug(`send ack: pos:${pos}`);
        this.sock.send(`/ack/${this.sid}/${pos}/`, this.rinfo.port, this.rinfo.address);
    }

    sendData (pos: number, data: Buffer): Promise<void> {
        return new Promise((resolve) => {
            if (data.length > Session.maxPayloadSize) {
                const loop = (lo: number, hi: number) => {
                    const buf = data.subarray(lo, hi);
                    this.sendDataChunk(pos, buf);
                    pos += buf.length;

                    if (hi >= data.length) {
                        return resolve();
                    }

                    setImmediate(() => loop(hi,
                        Math.min(hi + Session.maxPayloadSize, data.length)));
                };

                loop(0, Math.min(Session.maxPayloadSize, data.length));

            } else {
                setImmediate(() => {
                    this.sendDataChunk(pos, data);
                    resolve();
                });
            }
        });
    }

    sendDataChunk (pos: number, data: Buffer) {
        this.debug(`send data: pos:${pos} data:${data.toString()}`);
        this.sock.send(`/data/${this.sid}/${pos}/${this.escape(data).toString()}/`,
            this.rinfo.port, this.rinfo.address);
    }

    log (...msg: unknown[]) {
        console.log(`[sid:${this.sid}]: ${msg[0]}`, ...msg.slice(1));
    }

    debug (...msg: unknown[]) {
        if (!process.env.DEBUG) {
            return;
        }

        console.log(`[sid:${this.sid}]: ${msg[0]}`, ...msg.slice(1));
    }
}
