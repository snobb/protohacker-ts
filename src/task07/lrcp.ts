import { RemoteInfo, Socket } from '../lib/udp-server';
import { EventEmitter } from 'node:events';
import { Session } from './session';

/* eslint-disable no-console */

export type Message = {
    type: string,
    sid: number,
    pos?: number,
    data?: Buffer,
};

const minSID = 0;
const maxSID = 2147483648;
const sweeperInterval = 2000; // 2sec

export class LRCP extends EventEmitter {
    private sessions = new Map<number, Session>();
    private interval: NodeJS.Timer;

    constructor () {
        super();

        this.interval = setInterval(() => {
            for (const [sid, session] of this.sessions) {
                if (session.isClosed()) {
                    this.sessions.delete(sid);
                    continue;
                }

                if (session.hasExpired()) {
                    console.log('session expired:', sid);
                    session.close();
                    this.sessions.delete(sid);
                }
            }
        }, sweeperInterval);
    }

    handle (buf: Buffer, rinfo: RemoteInfo, sock: Socket) {
        let msg: Message;
        try {
            msg = this.getMessage(buf.toString());

        } catch (err) {
            console.error(`error: ${(<Error>err).message}`);
            return;
        }

        let session = this.sessions.get(msg.sid);
        if (!session) {
            session = new Session(msg.sid, sock, rinfo);

            if (msg.type === 'connect') {
                this.sessions.set(msg.sid, session);
                this.emit('session', session);

            } else {
                sock.send(`/close/${msg.sid}/`, rinfo.port, rinfo.address);
                session.close();
                return;
            }
        }

        session.handle(msg);
    }

    close () {
        clearInterval(this.interval);
    }

    getMessage (raw: string): Message {
        if (raw[0] !== '/' || raw[raw.length - 1] !== '/') {
            throw new Error(`invalid message: ${raw}`);
        }

        const [type, sid, ...[pos, ...data]] = raw.slice(1, raw.length - 1).split('/');

        if (!type || !sid) {
            throw new Error(`invalid message - sid and type are required: ${raw}`);
        }

        let nsid = 0;
        nsid = parseInt(sid, 10);
        if (isNaN(nsid)) {
            throw new Error('sid is not a number');
        }

        if (nsid < minSID || nsid > maxSID) {
            throw new Error(`sid is out of range ${minSID}-${maxSID}`);
        }

        let npos = 0;
        if (pos) {
            npos = parseInt(pos, 10);
            if (isNaN(npos)) {
                throw new Error('pos is not a number');
            }
        }

        if (data.length > 1) {
            // since we split above, the data may be split incorrectly if it contains too many
            // fields. The CORRECT split would only be on the escaped slash '\\/', so in order to
            // indentify a case of too many fields we check if every token but the last ends with
            // a backslash.
            for (let i = 0; i < data.length - 1; i += 1) {
                const token = data[i];
                if (token[token.length - 1] !== '\\') {
                    throw new Error('too many fields');
                }
            }
        }

        return { type,
            sid: nsid,
            pos: pos ? npos : undefined,
            data: data.length > 0 ? Buffer.from(data.join('/')) : undefined };
    }
}
