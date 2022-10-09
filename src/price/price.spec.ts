import { Price } from './price';

describe('price', () => {
    describe('message', () => {
        let data: Buffer;
        let price: Price;

        beforeEach(() => {
            price = new Price();
            data = Buffer.from([
                0x49, // I
                0x00, 0x00, 0x30, 0x39, // 12345
                0x00, 0x00, 0x00, 0x65, // 101
            ]);
        });

        it('should parse message successfully', () => {
            const msg = price.parseMessage(data);
            expect(msg).toEqual({
                type: 'I',
                payload: {
                    time: 12345,
                    data: 101
                }
            });
        });
    });
});
