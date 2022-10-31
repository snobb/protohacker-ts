import { Transform, TransformCallback, TransformOptions } from 'node:stream';

/* eslint-disable no-console */

type request = {
    method: 'isPrime',
    number: number
}

export class PrimeTransform extends Transform {
    cache: Set<number>;
    constructor (opts?: TransformOptions) {
        super({ ...opts });
        this.cache = new Set<number>();
    }

    _transform (chunk: Buffer, _: BufferEncoding, done: TransformCallback) {
        let req: request;

        try {
            req = JSON.parse(chunk.toString());
        } catch (err) {
            console.error('Invalid message: %s', (<Error>err).message);
            return this.send({ error: (<Error>err).message });
        }

        if (!this.validate(req)) {
            console.error('Invalid message: %j', req);
            return this.send({ error: 'invalid message' });
        }

        this.send({ method: 'isPrime', prime: this.isPrime(req.number) });

        done();
    }

    validate (req: request) {
        return req?.method === 'isPrime' && typeof req?.number === 'number';
    }

    isPrime (num: number) {
        if (num <= 1 || !Number.isSafeInteger(num)) {
            return false;
        }

        if (this.cache.has(num)) {
            return true;
        }

        const sqrtNum = Math.floor(Math.sqrt(num));

        for (let i = 2; i <= sqrtNum; i += 1) {
            if (num % i === 0) {
                return false;
            }
        }

        this.cache.add(num);

        return true;
    }

    send (obj: unknown) {
        this.push(`${JSON.stringify(obj)}\n`);
    }
}
