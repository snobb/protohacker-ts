type Dir = {
    kind: 'dir';
    name: string;
};

type File = {
    kind: 'file';
    name: string;
    length: number;
};

export class Store {
    private store = new Map<string, Buffer[]>();

    get (path: string, rev?: string) {
        const revs = this.store.get(path);
        if (!revs || revs.length === 0) {
            return;
        }

        const nrev = (rev)
            ? parseInt(
                rev[0] === 'r' ? rev.substring(1) : rev, 10)
            : revs.length;

        if (isNaN(nrev)) {
            return;
        }

        return revs[nrev - 1];
    }

    put (path: string, data: Buffer) {
        const revs = this.store.get(path) || [];
        if (!this.store.has(path)) {
            this.store.set(path, revs);
        } else {
            // check if the same data have already been put and return the revision.
            for (let i = 0; i < revs.length; i += 1) {
                if (Buffer.compare(data, revs[i]) === 0) {
                    return i + 1;
                }
            }
        }

        revs.push(data);
        return revs.length;
    }

    list (path: string) {
        const dirs = new Map<string, Dir>();
        const files = <File[]>[];

        if (path[path.length - 1] !== '/') {
            path = path.concat('/');
        }

        for (const [k, v] of this.store.entries()) {
            if (!k.startsWith(path)) {
                continue;
            }

            const file = k.substring(path.length);
            const idx = file.indexOf('/');

            if (idx !== -1) {
                const dirName = file.slice(0, idx + 1);
                dirs.set(dirName, {
                    kind: 'dir',
                    name: dirName
                });
            } else {
                files.push({
                    kind: 'file',
                    name: file,
                    length: v.length
                });
            }
        }

        const dirsArray = Array.from(dirs.values());
        dirsArray.sort();
        files.sort((a, b) => ((a.name < b.name) ? -1 : Number(a.name > b.name)));

        return [
            ...dirsArray,
            ...files
        ];
    }

    reset () {
        this.store.clear();
    }
}
