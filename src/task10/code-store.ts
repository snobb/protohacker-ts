/*
import { Transform, TransformCallback } from 'node:stream';
import { log } from '../lib/log';
*/

/* eslint-disable no-console */

/*
type PutContext = {
    fname: string,
    size: number,
    need: number
}

export class CodeStore extends Transform {
    private store: Record<string, Buffer[]> = {};
    private putContext?: PutContext;
    private chunks = [];
    private need = {;

    _transform (chunk: Buffer, _: BufferEncoding, done: TransformCallback) {
        done();
    }

    handleLine (line: string) {
        this.send('READY');

        const toks = line.trim().split(' ');
        if (line.length === 0 || toks.length === 0) {
            this.send('ERR illegal method:');
        }

        const [cmd, ...args] = [...toks];

        switch (cmd) {
        case 'get':
            try {
                const { fname, rev } = this.validateGetArgs(args);
                this.getFile(fname, rev);
            } catch (err) {
                this.send((<Error>err).message);
            }

            break;

        case 'put':
            try {
                const { fname, size } = this.validatePutArgs(args);
                this.getFile(fname, size);
            } catch (err) {
                this.send((<Error>err).message);
            }

            break;

        case 'list':
            try {
                const dir = this.validateListArgs(args);
                this.listFiles(dir);
            } catch (err) {
                this.send((<Error>err).message);
            }

            break;

        case 'help':
            this.send('OK usage: HELP|GET|PUT|LIST');
            break;

        case 'clear-data':
            this.store = {};
            break;

        default:
            this.send(`ERR illegal method: ${cmd}`);

        }
    }

    validateGetArgs (args: string[]) {
        if (args.length < 1 || args.length > 2) {
            throw new Error('ERR usage: GET file [revision]');
        }

        const fname = this.validateName(args[0]);

        let rev = -1;
        if (args[1]) {
            const rstr = (args[1][0] === 'r') ? args[1].slice(1) : args[1];
            rev = parseInt(rstr, 10);
            if (Number.isNaN(rev)) {
                throw new Error('ERR no such revision');
            }
        }

        return { fname, rev };
    }

    validatePutArgs (args: string[]) {
        if (args.length !== 2) {
            throw new Error('ERR usage: PUT file length newline data');
        }

        const fname = this.validateName(args[0]);
        const size = parseInt(args[1], 10) || 0;
        return { fname, size };
    }

    validatePutData (data: Buffer) {
    }

    validateListArgs (args: string[]) {
        if (args.length !== 1) {
            throw new Error('ERR usage: LIST dir');
        }

        const fname = this.validateName(args[0]);
        return fname;
    }

    validateName (fname: string) {
        if (fname.length === 0 || fname[0] !== '/') {
            throw new Error('ERR illegal file name');
        }

        let prev;
        for (const ch of fname) {
            if (ch === '/' && prev === '/') {
                throw new Error('ERR illegal file name');
            }

            prev = ch;

            if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') ||
                   (ch >= '0' && ch <= '9') ||
                   (ch === '.') || (ch === '/') ||
                   (ch === '-') || (ch === '_')) {
                continue;
            }

            throw new Error('ERR illegal file name');
        }

        return fname;
    }

    getFile (fname: string, rev: number) {
        if (!this.store[fname]) {
            throw new Error('ERR no such file');
        }

        if (rev === -1) {
            return this.store[fname].at(rev);
        }

        if (rev < 1 || rev > this.store[fname].length) {
            throw new Error('ERR no such revision');
        }

        return this.store[fname][rev - 1];
    }

    putFile (fname: string, data: Buffer) {
        const revs = (this.store[fname] || []);
        revs.push(data);
        this.store[fname] = revs;

        return revs.length;
    }

    listFiles (dir: string) {
    }

    send (msg: string) {
        log.info(`send: ${msg}`);
        this.push(`${msg}\n`);
    }
}
*/
