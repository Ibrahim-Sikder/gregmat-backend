import { BaseQueue } from '@service/queues/base.queue';
import mainIdeaWorker from '@worker/mainIdea.worker';

class MainIdeaQueue extends BaseQueue {
    constructor() {
        super('mainIdea');
        this.processJob('gradeMainIdeaAttempt', 5, mainIdeaWorker.gradeMainIdeaAttempt);
    }

    public addMainIdeaJob(name: string, data: any): void {
        this.addJob(name, data);
    }
}

const mainIdeaQueue = new MainIdeaQueue();

export default mainIdeaQueue;
