import { Socket } from 'node:net';
import { readLine } from '../lib/tools';

/* eslint-disable no-console */

type request = {
    method: 'isPrime',
    number: number
}

const cache = new Set<number>();

function validate (req: request) {
    return req?.method === 'isPrime' && typeof req?.number === 'number';
}

function isPrime (num: number) {
    if (num <= 1 || !Number.isSafeInteger(num)) {
        return false;
    }

    if (cache.has(num)) {
        return true;
    }

    const sqrtNum = Math.floor(Math.sqrt(num));

    for (let i = 2; i <= sqrtNum; i += 1) {
        if (num % i === 0) {
            return false;
        }
    }

    cache.add(num);

    return true;
}

export async function prime (conn: Socket) {
    const send = (obj: unknown) => conn.write(`${JSON.stringify(obj)}\n`);
    const fatal = (obj: unknown) => {
        send(obj);
        conn.destroy();
    };

    for await (const line of readLine(conn)) {
        let req: request;
        try {
            req = JSON.parse(line);
        } catch (error) {
            console.error('Invalid message: %s', (<Error>error).message);
            return fatal({ error });
        }

        if (!validate(req)) {
            console.error('Invalid message: %j', req);
            return fatal({ error: 'invalid message' });
        }

        send({ method: 'isPrime', prime: isPrime(req.number) });
    }
}
