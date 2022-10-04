import { createInterface } from 'node:readline';

export function readLine (input: NodeJS.ReadableStream, output?: NodeJS.WritableStream) {
    return createInterface({
        input,
        output,
        crlfDelay: Infinity
    });
}
