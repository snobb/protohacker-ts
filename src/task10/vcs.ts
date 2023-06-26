import { LoggerStream } from '../lib/logger-stream';
import { ReaderStream } from './reader-stream';
import { Socket } from 'node:net';
import { Store } from './store';
import { Writable } from 'node:stream';
import { log } from '../lib/log';

// The code (and the whole challenge) is highly inspired (and mimics) that of George Borisov.
// I cannot claim any credits here. :)

const MIN_ASCII_PRINTABLE = 0x20; // the printable range of ASCII is
const MAX_ASCII_PRINTABLE = 0x7f; // 30-127 + new line and tab characters.

function send (w: Writable, data: string | Buffer) {
    w.write(data);
    w.write('\n');
}

export class VCS {
    private store = new Store();

    async handleConnection (conn: Socket) {
        const id = `${conn.remoteAddress}:${conn.remotePort}`;

        const inStream = new LoggerStream(id, '<<<');
        const outStream = new LoggerStream(id, '>>>');

        const rs = new ReaderStream(inStream);

        conn
            .on('error', (err: Error) => {
                log.info(id, 'ERROR', err.message);
                conn.destroy();
            })
            .on('close', () => {
                log.info(id, 'CLOSED');
            })
            .pipe(inStream);

        outStream.pipe(conn);

        outer: // eslint-disable-line no-labels
        while (!conn.closed) {
            send(outStream, 'READY');

            // eslint-disable-next-line no-await-in-loop
            const line = await rs.readLine();
            const args = line.toString().split(' ');
            const cmd = args.shift()?.toUpperCase();

            if (args.length > 0 && !this.isValidFileName(args[0])) {
                send(outStream, 'ERR illegal file name');
                continue;
            }

            if (cmd === 'GET') {
                if (args.length < 1 || args.length > 2) {
                    send(outStream, 'ERR usage: GET file [revision]');
                    continue;
                }

                log.info(cmd, args);
                const data = this.store.get(args[0], args[1]);
                if (!data) {
                    send(outStream, 'ERR no such revision');
                    continue;
                }

                send(outStream, `OK ${data.length}`);
                outStream.write(data);

            } else if (cmd === 'PUT') {
                if (args.length !== 2) {
                    send(outStream, 'ERR usage: PUT file length newline data');
                    continue;
                }

                log.info(cmd, args);
                const len = parseInt(args[1], 10);
                if (isNaN(len)) {
                    send(outStream, 'ERR usage: PUT file length newline data');
                    continue;
                }

                // eslint-disable-next-line no-await-in-loop
                const data = await rs.readBytes(len);
                for (const ch of data) {
                    if (!this.isPrintable(ch)) {
                        send(outStream, 'ERR text files only');
                        continue outer; // eslint-disable-line no-labels
                    }
                }

                const rev = this.store.put(args[0], data);
                send(outStream, `OK r${rev}`);

            } else if (cmd === 'LIST') {
                if (args.length !== 1) {
                    send(outStream, 'ERR usage: LIST dir');
                    continue;
                }

                log.info(cmd, args);
                const recs = this.store.list(args[0]);

                send(outStream, `OK ${recs.length}`);

                for (const rec of recs) {
                    if (rec.kind === 'dir') {
                        send(outStream, `${rec.name} DIR`);
                    } else if (rec.kind === 'file') {
                        send(outStream, `${rec.name} r${rec.length}`);
                    } else {
                        throw new Error('dafaq did I just get?!');
                    }
                }

            } else if (cmd === 'PURGE-DATA') { // non-standard command to clear the state.
                this.store.reset();
                send(outStream, 'PURGED');

            } else if (cmd === 'HELP') {
                send(outStream, 'OK usage: HELP|GET|PUT|LIST');

            } else {
                send(outStream, `ERR illegal method: ${cmd}`);
            }
        }
    }

    isValidFileName (name: string) {
        if (!name || name[0] !== '/') {
            return false;
        }

        let prev = '';
        for (const ch of name) {
            if (ch === '/' && prev === '/') {
                return false;
            }

            prev = ch;

            if (!this.isText(ch)) {
                return false;
            }
        }

        return true;
    }

    isText (ch: string) {
        return ((ch >= '0' && ch <= '9') ||
                (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
                ch === '.' || ch === '/' || ch === '-' || ch === '_');
    }

    isPrintable (code: number) {
        return (code === 0x0a || code === 0x0d || code === 0x09 ||
        (code >= MIN_ASCII_PRINTABLE && code <= MAX_ASCII_PRINTABLE));
    }
}
