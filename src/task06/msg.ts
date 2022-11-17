// import { Socket } from 'node:net';

/* eslint-disable no-console */

export const TypeError = 0x10;
export const TypePlate = 0x20;
export const TypeTicket = 0x21;
export const TypeWantHeartbeat = 0x40;
export const TypeHeartbeat = 0x41;
export const TypeIAMCamera = 0x80;
export const TypeIAMDispatcher = 0x81;

export function formatString (str: string) {
    if (str.length > 255) {
        throw new Error('error message is too long');
    }

    const bytes = str.split('')
        .map((ch) => ch.charCodeAt(0));

    return Buffer.from([bytes.length, ...bytes]);
}

export function formatError (error: string) {
    let bytes: Buffer;

    console.log(error);
    try {
        bytes = formatString(error);
    } catch (err) {
        return console.error('could not write error:', (<Error>err).message);
    }

    return Buffer.from([TypeError, ...bytes]);
}

// === PLATE ============================================================
export type MsgPlate = {
    plate: string,
    timestamp: number,
}

export function readPlateMessage (msg: Buffer) {
    const len = msg.readUint8();
    const plate = msg.subarray(1, 1 + len).toString();
    const timestamp = msg.readUint32BE(len + 1);

    return { plate, timestamp };
}

// === CAMERA ===========================================================
export type MsgIAMCamera = {
    road: number,
    mile: number
    limit: number,
}

export function readCameraMessage (msg: Buffer) {
    return {
        road: msg.readUint16BE(),
        mile: msg.readUint16BE(2),
        limit: msg.readUint16BE(4),
    };
}

// === Dispatcher =======================================================
export function readDispatcherMessage (msg: Buffer) {
    const len = msg.readUint8();

    const roads: number[] = [];
    let offset = 1;

    for (let i = 0; i < len; i += 1) {
        roads.push(msg.readUint16BE(offset));
        offset += 2;
    }

    return roads;
}

// === Ticket ===========================================================
export type Reading = {
    mile: number,
    timestamp: number,
}

export type Ticket = {
    plate: string,
    road: number,
    reading1: Reading,
    reading2: Reading,
    speed: number,
}

export function writeTicket (conn: NodeJS.WritableStream, ticket: Ticket) {
    const strBuf = formatString(ticket.plate);
    const msgBuf = Buffer.alloc(16); // 4*uint16 + 2*uint32

    let offset = msgBuf.writeUint16BE(ticket.road);
    offset = msgBuf.writeUint16BE(ticket.reading1.mile, offset);
    offset = msgBuf.writeUint32BE(ticket.reading1.timestamp, offset);
    offset = msgBuf.writeUint16BE(ticket.reading2.mile, offset);
    offset = msgBuf.writeUint32BE(ticket.reading2.timestamp, offset);
    msgBuf.writeUint16BE(ticket.speed, offset);

    conn.write(Buffer.concat([Buffer.from([TypeTicket]), strBuf, msgBuf]));
}
