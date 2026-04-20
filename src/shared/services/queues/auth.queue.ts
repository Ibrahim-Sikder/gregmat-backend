import type { IAuthJob } from '@auth/interfaces/auth.interface';
import { BaseQueue } from '@service/queues/base.queue';
import authWorker from '@worker/auth.workers';

class AuthQueue extends BaseQueue {
    constructor() {
        super('auth');
        this.processJob('addAuthUserToDB', 10, authWorker.addAuthUserToDB);
        this.processJob('deleteAuthUserFromDB', 10, authWorker.deleteAuthUserFromDB);
        this.processJob('unblockExpiredUsers', 2, authWorker.unblockExpiredUsers);
        this.processJob('deleteUnverifiedUsers', 2, authWorker.deleteUnverifiedUsers);
    }

    public addAuthJob(name: string, data: IAuthJob): void {
        this.addJob(name, data);
    }

    public addRecurringUnblockJob(): void {
        // Run every 10 minutes
        this.queue.add(
            'unblockExpiredUsers',
            {},
            {
                repeat: { cron: '*/10 * * * *' },
                attempts: 3,
                backoff: { type: 'fixed', delay: 5000 },
            }
        );
    }

    public addRecurringDeleteUnverifiedJob(): void {
        // Run once a day at midnight
        this.queue.add(
            'deleteUnverifiedUsers',
            {},
            {
                repeat: { cron: '0 0 * * *' },
                attempts: 3,
                backoff: { type: 'fixed', delay: 5000 },
            }
        );
    }
}

const authQueue = new AuthQueue();

export default authQueue;
