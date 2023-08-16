import { createInterface } from 'node:readline';

export function readLine (input: NodeJS.ReadableStream, output?: NodeJS.WritableStream) {
    return createInterface({
        input,
        output,
        crlfDelay: Infinity
    });
}

export type Next<T> = (item: T, next: ()=> void)=> void;

export function asyncForEach<T> (items: T[], next: Next<T>) {
    return (async function loop (i: number) {
        if (!items[i]) {
            return;
        }

        await next(items[i], () => loop(i + 1));
    })(0);
}
