import { config } from '@root/config';
import userService from '@service/db/user.service';
import type { DoneCallback, Job } from 'bull';
import type Logger from 'bunyan';

const log: Logger = config.createLogger('userWorker');

class UserWorker {
    async addUserToDB(job: Job, done: DoneCallback): Promise<void> {
        try {
            const { value } = job.data;
            await userService.createUser(value);
            done(null, job.data);
        } catch (error) {
            log.error(error);
            done(error as Error);
        }
    }

    async deleteUserFromDB(job: Job, done: DoneCallback): Promise<void> {
        try {
            const { value } = job.data;
            await userService.deleteUserById(value);
            done(null, job.data);
        } catch (error) {
            log.error(error);
            done(error as Error);
        }
    }
}

const userWorker = new UserWorker();
export default userWorker;
