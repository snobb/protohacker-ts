import {
    MsgIAMCamera,
    Reading,
    Ticket,
    writeTicket
} from './msg';
import { Socket } from 'node:net';
import { SpeedMessageTransform } from './speed-msg-transform';
import { SpeedTransform } from './speed-transform';

/* eslint-disable no-console */

type TicketDays = Map<string, Set<number>>
type PlateReading = Map<string, Reading[]> // concat(plate,road) -> [mile, time record].
type IssuedTickets = Map<number, Ticket[]>; // road -> [Ticket]
type Dispatchers = Map<number, NodeJS.WritableStream> // road -> connection

export class SpeedDaemon {
    private plates: PlateReading = new Map(); // concat(plate,road) -> [mile, time record].
    private issuedTickets: IssuedTickets = new Map();
    private dispatchers: Dispatchers = new Map();
    private ticketDays: TicketDays = new Map();

    handle (conn: Socket) {
        const speedTransform = new SpeedTransform(this, conn);

        conn
            .pipe(new SpeedMessageTransform())
            .pipe(speedTransform)
            .pipe(conn)
            .on('close', () => speedTransform.shutdown())
            .on('error', console.error);
    }

    getKey (plate: string, road: number) {
        return `${plate}::${road}`;
    }

    registerPlate (camera: MsgIAMCamera, plate: string, timestamp: number) {
        const key = this.getKey(plate, camera.road);
        this.plates.set(key, this.plates.get(key) || []);
        this.plates.get(key)?.push({
            mile: camera.mile,
            timestamp,
        });

        console.log('Registering plate %s for road %s: [mile: %s, time: %s]',
            plate, camera.road, camera.mile, timestamp);
    }

    registerDispatcher (road: number, conn: Socket) {
        this.dispatchers.set(road, conn);
    }

    issueTickets (plate: string, camera?: MsgIAMCamera) {
        if (!camera) {
            throw new Error('camera is not set');
        }

        const records = this.plates.get(this.getKey(plate, camera.road)) || [];

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
                Math.floor(speed), camera.limit);

            if (speed > (camera.limit + 0.3)) {
                console.log('speeding detected for %s - speed: %s, limit: %s',
                    plate, Math.floor(speed), camera.limit);

                this.trackTicket({
                    plate,
                    road: camera.road,
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
}
