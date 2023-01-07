export type Job = {
    id: number
    queue: string
    priority: number
    body: unknown
}

export class PQueue {
    private index: number[] = [];
    private store = new Map<number, Job[]>();
    private size = 0;

    enque (job: Job) {
        const que = this.store.get(job.priority);
        if (!que) {
            // no queue for this priority yet
            this.index.push(job.priority);
            this.index.sort((a, b) => a - b);
            this.store.set(job.priority, [job]);
            this.size += 1;
            return;
        }

        que.push(job);
        this.size += 1;
    }

    deque () {
        if (this.index.length === 0) {
            return;
        }

        const idx = this.index[this.index.length - 1];
        const maxque = this.store.get(idx);
        if (!maxque) {
            throw new Error('priority and store out of sync');
        }

        const item = maxque.shift();

        if (maxque.length === 0) {
            this.index.pop();
            this.store.delete(idx);
        }

        this.size -= 1;
        return item;
    }

    delete (id: number) {
        for (const [pri, que] of this.store.entries()) {
            for (let i = 0; i < que.length; i += 1) {
                if (que[i].id === id) {
                    // found
                    que.splice(i, 1);

                    const idx = this.index.indexOf(pri);
                    this.index.splice(idx, 1);

                    if (this.store.get(pri)?.length === 0) {
                        this.store.delete(pri);
                    }

                    this.size -= 1;
                    return true;
                }
            }
        }

        return false;
    }

    getSize () {
        return this.size;
    }

    getHighestPriority () {
        if (this.index.length === 0) {
            return -1;
        }

        return this.index[this.index.length - 1];
    }
}
