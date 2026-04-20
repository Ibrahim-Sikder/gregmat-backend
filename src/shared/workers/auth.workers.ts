import { config } from '@root/config';
import { authService } from '@service/db/auth.service';
import type { DoneCallback, Job } from 'bull';
import type Logger from 'bunyan';

const log: Logger = config.createLogger('authWorker');

class AuthWorker {
    async addAuthUserToDB(job: Job, done: DoneCallback): Promise<void> {
        try {
            const { value } = job.data;
            await authService.createAuthUser(value);
            job.progress(100);
            done(null, job.data);
        } catch (error) {
            log.error(error);
            done(error as Error);
        }
    }

    async deleteAuthUserFromDB(job: Job, done: DoneCallback): Promise<void> {
        try {
            const { value } = job.data;
            await authService.deleteAuthUserByUId(value);
            job.progress(100);
            done(null, job.data);
        } catch (error) {
            log.error(error);
            done(error as Error);
        }
    }

    async unblockExpiredUsers(job: Job, done: DoneCallback): Promise<void> {
        try {
            await authService.unblockExpiredUsers();
            job.progress(100);
            done(null, job.data);
        } catch (error) {
            log.error(error);
            done(error as Error);
        }
    }

    async deleteUnverifiedUsers(job: Job, done: DoneCallback): Promise<void> {
        try {
            await authService.deleteUnverifiedUsers();
            job.progress(100);
            done(null, job.data);
        } catch (error) {
            log.error(error);
            done(error as Error);
        }
    }
}

const authWorker = new AuthWorker();

export default authWorker;
