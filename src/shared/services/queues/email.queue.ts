import { BaseQueue } from '@service/queues/base.queue';
import type { IEmailJob } from '@user/interfaces/user.interface';
import emailWorker from '@worker/email.workers';

class EmailQueue extends BaseQueue {
    constructor() {
        super('emails');

        this.processJob('verificationEmail', 10, emailWorker.sendEmail);
        this.processJob('forgotPasswordEmail', 10, emailWorker.sendEmail);
        this.processJob('resetPasswordConfirmationEmail', 10, emailWorker.sendEmail);
    }

    public addEmailJob(name: string, data: IEmailJob): void {
        this.addJob(name, data);
    }
}

const emailQueue: EmailQueue = new EmailQueue();
export default emailQueue;
