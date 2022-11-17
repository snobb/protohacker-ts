import {
    MsgIAMCamera,
    TypeError,
    TypeHeartbeat,
    TypeIAMCamera,
    TypeIAMDispatcher,
    TypePlate,
    TypeWantHeartbeat,
    formatError,
    readCameraMessage,
    readDispatcherMessage,
    readPlateMessage,
} from './msg';
import { Transform, TransformCallback, TransformOptions } from 'node:stream';
import { Socket } from 'node:net';
import { SpeedDaemon } from './speed-daemon';

/* eslint-disable no-console */

export class SpeedTransform extends Transform {
    private camera?: MsgIAMCamera;
    private roads?: number[];
    private heartbeat?: NodeJS.Timer;

    constructor (private global: SpeedDaemon, private conn: Socket, opts?: TransformOptions) {
        super({ ...opts });
    }

    _transform (msg: Buffer, _: BufferEncoding, done: TransformCallback) {
        const kind = msg.readUint8();

        // handle inbound data
        try {
            switch (kind) {
            case TypePlate:
                console.log('handling Plate message');
                this.handlePlate(msg.subarray(1));
                break;

            case TypeWantHeartbeat:
                console.log('handling wantHeartbeat message');
                this.handleHeartbeat(msg.subarray(1));
                break;

            case TypeIAMCamera:
                console.log('handling IAMCamera message');
                this.handleCamera(msg.subarray(1));
                break;

            case TypeIAMDispatcher:
                console.log('handling IAMDispatcher message');
                this.handleDispatcher(msg.subarray(1));
                break;

            case TypeError:
                console.log('passing error message');
                this.push(msg);
                break;

            default:
                this.push(formatError(`invalid message type: ${kind}`));
            }

        } catch (err) {
            console.error('speed-transform error:', err);
            this.push(formatError((<Error>err).message));
        } finally {
            done();
        }
    }

    handleHeartbeat (buf: Buffer) {
        if (this.heartbeat) {
            throw new Error('Heartbeat is already set');
        }

        const interval = buf.readUint32BE() * 100;

        if (interval === 0) {
            return;
        }

        this.heartbeat = setInterval(() => {
            this.push(Buffer.of(TypeHeartbeat));
        }, interval);
    }

    shutdown () {
        console.log('shutting down...');
        if (this.heartbeat) {
            clearInterval(this.heartbeat);
        }
    }

    handlePlate (buf: Buffer) {
        const msg = readPlateMessage(buf);

        if (!this.camera) {
            throw new Error('No cameras has been registered yet for this road');
        }

        console.log('got a new plate', msg);

        this.global.registerPlate(this.camera, msg.plate, msg.timestamp);
        this.global.issueTickets(msg.plate, this.camera);
        this.global.sendTickets(this.camera.road);
    }

    handleCamera (buf: Buffer) {
        if (this.camera) {
            throw new Error('Has already been identified as camera - duplicate message.');
        }

        const msg = readCameraMessage(buf);
        this.camera = msg;
        console.log('registering camera at road %s [mile: %s, limit: %s]',
            msg.road, msg.mile, msg.limit);
    }

    handleDispatcher (buf: Buffer) {
        if (this.camera) {
            throw new Error('Has already been identified as camera - no dispatcher.');
        }

        if (this.roads) {
            throw new Error('Has already been identified as dispatcher.');
        }

        this.roads = readDispatcherMessage(buf);

        console.log('New dispatcher for roads:', this.roads);

        for (const road of this.roads) {
            this.global.registerDispatcher(road, this.conn);
            this.global.sendTickets(road); // send issued tickets for the given roads.
        }
    }
}
