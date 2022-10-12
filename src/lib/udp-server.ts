import { BindOptions, RemoteInfo, Socket, createSocket } from 'node:dgram';
export { BindOptions, RemoteInfo, Socket } from 'node:dgram';

/* eslint-disable no-console */

export type DgramHandler = (msg: Buffer, info: RemoteInfo, socket: Socket)=> void

export function udpServer (opts: BindOptions, handle: DgramHandler) {
    const server: Socket = createSocket('udp4')
        .on('connect', () => {
            const addr = server.address();
            console.log('request from %s:%d', addr.address, addr.port);
        })
        .on('message', (msg: Buffer, rinfo: RemoteInfo) => handle(msg, rinfo, server))
        .on('error', (err: Error) => {
            console.error('Server error: %s', err.message);
        })
        .bind(opts.port, opts.address, () => {
            const addr = server.address();
            console.log('listening on %s:%d', addr.address, addr.port);
        });
    return server;
}
