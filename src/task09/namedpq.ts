import { Job, PQueue } from './pqueue';
export { Job } from './pqueue';

export class NamedPQueue {
    private store = new Map<string, PQueue>();

    enque (job: Job) {
        let que = this.store.get(job.queue);
        if (!que) {
            que = new PQueue();
            this.store.set(job.queue, que);
        }

        que.enque(job);
    }

    deque (queues: string[]) {
        const que = this.maxQueue(queues);
        if (!que) {
            return;
        }

        return que.deque();
    }

    delete (id: number) {
        let ok = false;
        for (const que of this.store.values()) {
            ok = que.delete(id) || ok;
        }

        return ok;
    }

    private maxQueue (queues: string[]) {
        let maxPri = -1;
        let maxQue;

        for (const qname of queues) {
            const que = this.store.get(qname);
            if (!que) {
                continue;
            }

            if (que.getHighestPriority() > maxPri) {
                maxPri = que.getHighestPriority();
                maxQue = que;
            }
        }

        return maxQue;
    }
}
