import { Socket } from 'node:net';
import { readLine } from '../lib/tools';

/* eslint-disable no-console */

export class Chat {
    private ppls: Record<string, Socket> = {};
    private re = new RegExp(/^[a-zA-Z0-9]*$/);

    send (conn: Socket, msg: string) {
        conn.write(`${msg}\n`);
    }

    fatal (conn: Socket, msg: string) {
        conn.write(`${msg}\n`);
        conn.destroy();
    }

    async handle (conn: Socket) {
        const rl = readLine(conn, conn);
        const question = (msg: string) => new Promise((resolve) => rl.question(msg, resolve));

        const name = <string>(await question('Welcome to budgetchat! What shall I call you?\n'));
        if (!this.validate(name)) {
            return this.fatal(conn, 'invalid name');
        }

        this.register(name, conn);
        conn.on('end', () => {
            this.unregister(name, conn);
        });

        for await (const line of readLine(conn)) {
            this.broadcast(`[${name}] ${line}`, conn);
        }
    }

    validate (name: string) {
        return name && this.re.test(name);
    }

    register (name: string, conn: Socket) {
        if (this.ppls[name]) {
            return this.fatal(conn, `* duplicate name: ${name}`);
        }

        this.broadcast(`* ${name} joined`, conn);
        this.send(conn, `* the room contains: ${Object.keys(this.ppls).join(',')}`);
        this.ppls[name] = conn;
    }

    unregister (name: string, conn: Socket) {
        this.broadcast(`* ${name} left`, conn);
        delete this.ppls[name];
    }

    broadcast (msg: string, exclude: Socket) {
        for (const name of Object.keys(this.ppls)) {
            const sock = this.ppls[name];
            if (sock === exclude) {
                continue;
            }

            this.send(sock, msg);
        }
    }
}
