import { BaseQueue } from '@service/queues/base.queue';
import essayWorker from '@worker/essay.workers';

class EssayQueue extends BaseQueue {
    constructor() {
        super('essay');
        this.processJob('generateEssayFeedback', 5, essayWorker.generateEssayFeedback);
    }

    public addEssayJob(name: string, data: any): void {
        this.addJob(name, data);
    }
}

const essayQueue = new EssayQueue();

export default essayQueue;
