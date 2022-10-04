import { Socket, createServer } from 'node:net';

/* eslint-disable no-console */

export function tcpServer (port: number, handle: (conn: Socket)=> void) {
    const server = createServer()
        .on('connection', async (conn: Socket) => {
            const rAddr = conn.remoteAddress;
            const rPort = conn.remotePort;

            console.log('connected from: %s:%d', rAddr, rPort);

            conn.on('close', () => {
                console.log('disconnected from: %s:%d', rAddr, rPort);
            });

            conn.on('error', (err) => {
                console.log('Error for %s:%d: %s', rAddr, rPort, err.message);
                conn.destroy();
            });

            await handle(conn);
        })
        .on('error', (err: Error) => {
            console.error('Server error: %s', err.message);
        });

    server.listen(port, () => {
        console.log('listening on: %d', port);
    });

    return server;
}
