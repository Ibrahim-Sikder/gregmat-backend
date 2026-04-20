import { BaseQueue } from '@service/queues/base.queue';
import type { IUserJob } from '@user/interfaces/user.interface';
import userWorker from '@worker/user.worker';

class UserQueue extends BaseQueue {
    constructor() {
        super('user');

        this.processJob('addUserToDB', 10, userWorker.addUserToDB);
        this.processJob('deleteUserFromDB', 10, userWorker.deleteUserFromDB);
    }

    public addUserJob(name: string, data: IUserJob): void {
        this.addJob(name, data);
    }
}

const userQueue = new UserQueue();

export default userQueue;
