import * as assert from 'node:assert';
import { describe, test, beforeEach } from 'node:test';
import { BogusCoinStream } from './bogus-coin';

describe("BogusCoinTransform", () => {
  let stream: BogusCoinStream;
  const evilAddress = "7YWHMfk9JZe0LM0g1ZauHuiSxhI";

  beforeEach(() => {
    stream = new BogusCoinStream();
  });

  test("should return unmodified strings if there is no address", async () => {
    const data = "hello world foobar\n";
    stream.end(data);
    const chunks: Buffer[] = [];
    for await (const buf of stream) {
      chunks.push(buf);
    }
    assert.equal(chunks[0].toString(), data);
  });

  test('should rewrite address if only address is provided', async () => {
    const data = '7iKDZEwPZSqIvDnHvVN2r0hUWXD5rHX\n';
    stream.end(data);
    const chunks: Buffer[] = [];
    for await (const buf of stream) {
      chunks.push(buf);
    }
    assert.equal(chunks[0].toString(), `${evilAddress}\n`);
  });

  test('should rewrite address if address is at the end of the line', async () => {
    const data = 'hello foobar 7iKDZEwPZSqIvDnHvVN2r0hUWXD5rHX\n';
    stream.end(data);
    const chunks: Buffer[] = [];
    for await (const buf of stream) {
      chunks.push(buf);
    }
    assert.equal(chunks[0].toString(), `hello foobar ${evilAddress}\n`);
  });

  test('should rewrite address if address is at the beginning of the line', async () => {
    const data = '7iKDZEwPZSqIvDnHvVN2r0hUWXD5rHX hello foobar\n';
    stream.end(data);
    const chunks: Buffer[] = [];
    for await (const buf of stream) {
      chunks.push(buf);
    }
    assert.equal(chunks[0].toString(), `${evilAddress} hello foobar\n`);
  });

  test('should rewrite address if address is at the middle of the line', async () => {
    const data = 'foo bar baz 7iKDZEwPZSqIvDnHvVN2r0hUWXD5rHX hello foobar\n';
    stream.end(data);
    const chunks: Buffer[] = [];
    for await (const buf of stream) {
      chunks.push(buf);
    }
    assert.equal(chunks[0].toString(), `foo bar baz ${evilAddress} hello foobar\n`);
  });

  test('should rewrite multiple instances of the address', async () => {
    const data = 'foo bar baz 7iKDZEwPZSqIvDnHvVN2r0hUWXD5rHX 7iKDZEwPZSqIvDnHvVN2r0hUWXD5rHX hello foobar\n';
    stream.end(data);
    const chunks: Buffer[] = [];
    for await (const buf of stream) {
      chunks.push(buf);
    }
    assert.equal(chunks[0].toString(), `foo bar baz ${evilAddress} ${evilAddress} hello foobar\n`);
  });
});
