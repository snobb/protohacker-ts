import { Transform, TransformCallback } from 'node:stream';
import {
    // MsgIAMCamera,
    // MsgPlate,
    // Reading,
    // Ticket,
    TypeError,
    TypeHeartbeat,
    // TypeIAMCamera,
    // TypeIAMDispatcher,
    // TypePlate,
    TypeWantHeartbeat,
    // readCameraMessage,
    // readDispatcherMessage,
    // readPlateMessage,
    formatError,
    // writeTicket,
} from './msg';

/* eslint-disable no-console */

type ClientState = {
    heartbeatInterval?: number
    heartBeat?: NodeJS.Timer
    // camera?: MsgIAMCamera
    // roads?: number[]
}

// type TicketDays = Map<string, Set<number>>
// type PlateReading = Map<string, Reading[]> // concat(plate,road) -> [mile, time record].
// type IssuedTickets = Map<number, Ticket[]>; // road -> [Ticket]
// type Dispatchers = Map<number, NodeJS.WritableStream> // road -> connection

export class SpeedTransform extends Transform {
    // private plates: PlateReading = new Map(); // concat(plate,road) -> [mile, time record].
    // private issuedTickets: IssuedTickets = new Map();
    // private dispatchers: Dispatchers = new Map();
    // private ticketDays: TicketDays = new Map();

    _transform (msg: Buffer, _: BufferEncoding, done: TransformCallback) {
        const state: ClientState = {};
        const kind = msg.readUint8();

        function shutdown (cb: ()=> void) {
            if (state.heartBeat) {
                clearInterval(state.heartBeat);
            }

            cb();
        }

        // handle inbound data
        try {
            switch (kind) {
            // case TypePlate:
            //     console.log('handling Plate message');
            //     this.handlePlate(conn, state);
            //     break;

            case TypeWantHeartbeat:
                console.log('handling wantHeartbeat message');
                this.handleHeartbeat(msg.subarray(1), state);
                break;

                // case TypeIAMCamera:
                //     console.log('handling IAMCamera message');
                //     this.handleCamera(conn, state);
                //     break;

                // case TypeIAMDispatcher:
                //     console.log('handling IAMDispatcher message');
                //     this.handleDispatcher(conn, state);
                //     break;

            case TypeError:
                console.log('passing error message');
                this.push(msg);
                break;

            default:
                this.push(formatError(`invalid message type: ${kind}`));
            }

        } catch (err) {
            this.push(formatError((<Error>err).message));
        } finally {
            shutdown(done);
        }
    }

    handleHeartbeat (buf: Buffer, state: ClientState) {
        const interval = buf.readUint32BE() * 100;

        if (interval === 0) {
            return;
        }

        state.heartbeatInterval = interval;
        state.heartBeat = setInterval(() => {
            this.push(Buffer.of(TypeHeartbeat));
        }, interval);
    }

    /*
    handlePlate (buf: Buffer, state: ClientState) {
        const msg = readPlateMessageconn);

        if (!state.camera) {
            throw new Error('No cameras has been registered yet for this road');
        }

        const key = this.getKey(msg.plate, state.camera.road);
        this.plates.set(key, this.plates.get(key) || []);
        this.plates.get(key)?.push({
            mile: state.camera.mile,
            timestamp: msg.timestamp,
        });
        console.log('Registering plate %s for road %s: [mile: %s, time: %s]',
            msg.plate, state.camera.road, state.camera.mile, msg.timestamp);

        this.issueTickets(msg, state);
        this.sendTickets(state.camera.road);
    }

    handleCamera (buf: Buffer, state: ClientState) {
        const msg = readCameraMessage(buf);
        state.camera = msg;
        console.log('registering camera at road %s [mile: %s, limit: %s]',
            msg.road, msg.mile, msg.limit);
    }

    handleDispatcher (buf: Buffer, state: ClientState) {
        state.roads = readDispatcherMessage(buf);

        console.log('New dispatcher for roads:', state.roads);

        // for (const road of state.roads) {
        // this.dispatchers.set(road);
        // this.sendTickets(road);
        // }
    }

    getKey (plate: string, road: number) {
        return `${plate}${road}`;
    }

    issueTickets (plate: MsgPlate, state: ClientState) {
        if (!state.camera) {
            throw new Error('camera is not set');
        }

        const records = this.plates.get(this.getKey(plate.plate, state.camera.road)) || [];

        if (records.length > 1) {
            records.sort((a, b) => a.timestamp - b.timestamp);
        }

        for (let i = 1; i < records.length; i += 1) {
            const [r1, r2] = [records[i - 1], records[i]];

            const distance = Math.abs(r2.mile - r1.mile);
            const time = r2.timestamp - r1.timestamp;
            if (time === 0) {
                continue;
            }

            const speed = distance / time * 3600;

            console.log('calculated speed: %d, limit: %d',
                Math.floor(speed), state.camera.limit);

            if (speed > (state.camera.limit + 0.3)) {
                console.log('speeding detected for %s - speed: %s, limit: %s',
                    plate.plate, Math.floor(speed), state.camera.limit);

                this.trackTicket({
                    plate: plate.plate,
                    road: state.camera.road,
                    reading1: r1,
                    reading2: r2,
                    speed: Math.floor(speed * 100),
                });
            }
        }
    }

    trackTicket (ticket: Ticket) {
        const day1 = Math.floor(ticket.reading1.timestamp / 86400);
        const day2 = Math.floor(ticket.reading2.timestamp / 86400);

        this.ticketDays.set(ticket.plate, this.ticketDays.get(ticket.plate) || new Set());

        for (let i = day1; i <= day2; i += 1) {
            if (this.ticketDays.get(ticket.plate)?.has(i)) {
                console.log(`${ticket.plate} has already been ticketed on the ${i} day`);
                return; // already ticketed on the day.
            }
        }

        for (let i = day1; i <= day2; i += 1) {
            this.ticketDays.get(ticket.plate)?.add(i);
        }

        this.issuedTickets.set(ticket.road, this.issuedTickets.get(ticket.road) || []);
        this.issuedTickets.get(ticket.road)?.push(ticket);
    }

    sendTickets (road: number) {
        let ticket: Ticket | undefined;
        const conn = this.dispatchers.get(road);
        if (!conn) {
            console.log('No dispatchers for the road %s yet', road);
            return;
        }

        this.issuedTickets.set(road, this.issuedTickets.get(road) || []);
        while ((ticket = this.issuedTickets.get(road)?.shift()) !== undefined) {
            writeTicket(conn, ticket);
        }
    }
   */
}
