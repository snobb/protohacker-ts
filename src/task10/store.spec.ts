import * as assert from 'node:assert';
import { Store } from './store';

describe('code-store tests', () => {
    let store: Store;

    context('get/put tests', () => {
        beforeEach(() => {
            store = new Store();
        });

        it('should add value to the store', () => {
            const rev = store.put('/foo/bar', Buffer.from('foo'));
            assert.strictEqual(rev, 1);
            const foo = store.get('/foo/bar');

            assert.ok(foo !== undefined);
            assert.strictEqual(foo.toString(), 'foo');
        });

        it('should add value multiple times and get different revisions', () => {
            assert.strictEqual(store.put('/foo/bar', Buffer.from('foo')), 1);
            assert.strictEqual(store.put('/foo/bar', Buffer.from('bar')), 2);
            // should return existing revision for the existing content.
            assert.strictEqual(store.put('/foo/bar', Buffer.from('foo')), 1);

            let foo = store.get('/foo/bar');
            assert.ok(foo !== undefined);
            assert.equal(foo.toString(), 'bar');

            foo = store.get('/foo/bar', 'r1');
            assert.ok(foo !== undefined);
            assert.equal(foo.toString(), 'foo');

            foo = store.get('/foo/bar', 'r2');
            assert.ok(foo !== undefined);
            assert.equal(foo.toString(), 'bar');
        });
    });

    context('list tests', () => {
        before(() => {
            store.put('/foo/foo', Buffer.from('foo'));
            store.put('/foo/bar', Buffer.from('bar'));
            store.put('/foo/baz', Buffer.from('baz'));
            store.put('/bar/bar', Buffer.from('bar'));
            store.put('/bar/baz', Buffer.from('baz'));
            store.put('/baz', Buffer.from('foobar'));
        });

        it('should list files and folders correctly in the root', () => {
            const items = store.list('/');
            assert.strictEqual(items.length, 3);

            assert.strictEqual(items[0].kind, 'dir');
            assert.strictEqual(items[0].name, 'foo/');
            assert.strictEqual(items[1].kind, 'dir');
            assert.strictEqual(items[1].name, 'bar/');
            assert.strictEqual(items[2].kind, 'file');
            assert.strictEqual(items[2].name, 'baz');
        });

        it('should list files and folders correctly in the /foo folder', () => {
            const items = store.list('/foo');
            assert.strictEqual(items.length, 3);

            // files are sorted.
            assert.strictEqual(items[0].kind, 'file');
            assert.strictEqual(items[0].name, 'bar');
            assert.strictEqual(items[1].kind, 'file');
            assert.strictEqual(items[1].name, 'baz');
            assert.strictEqual(items[2].kind, 'file');
            assert.strictEqual(items[2].name, 'foo');
        });

        it('should list files and folders correctly in the bar folder', () => {
            const items = store.list('/bar');
            assert.strictEqual(items.length, 2);

            // files are sorted.
            assert.strictEqual(items[0].kind, 'file');
            assert.strictEqual(items[0].name, 'bar');
            assert.strictEqual(items[1].kind, 'file');
            assert.strictEqual(items[1].name, 'baz');
        });

        it('should not return anything for /baz because it\'s a file', () => {
            const items = store.list('/baz');
            assert.strictEqual(items.length, 0);
        });
    });
});
