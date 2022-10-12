import { RemoteInfo, Socket } from '../lib/udp-server';

/* eslint-disable no-console */

export class UnusualDB {
    private store: Record<string, string> = {};
    static version = 'Odd database v1.0';

    handle (msg: Buffer, rinfo: RemoteInfo, sock: Socket) {
        if (msg.length > 1000) {
            return console.error('receive: message is too big: %s', msg);
        }

        function send (message: string) {
            const buf = Buffer.from(message);
            if (buf.length > 1000) {
                return console.error('send: message is too big: %s', msg);
            }

            console.log('send:', message);
            sock.send(buf, rinfo.port, rinfo.address);
        }

        const { key, value, isInsert } = this.parse(msg.toString());

        if (key === 'version') {
            return send(`version=${UnusualDB.version}`);
        }

        if (isInsert) {
            console.log('insert: %s=%s', key, value);
            this.store[key] = value;
        } else {
            const query = this.store[key] || '';
            send(`${key}=${query}`);
        }
    }

    parse (msg: string) {
        const idx = msg.indexOf('=');
        const hi = (idx !== -1) ? idx : msg.length;
        return {
            key: msg.slice(0, hi),
            value: msg.slice(hi + 1),
            isInsert: idx !== -1
        };
    }
}
