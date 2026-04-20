import { config } from '@root/config';
import essayService from '@service/db/essay.service';
import geminiService from '@service/ai/gemini.service';
import type { DoneCallback, Job } from 'bull';
import type Logger from 'bunyan';

const log: Logger = config.createLogger('essayWorker');

class EssayWorker {
    async generateEssayFeedback(job: Job, done: DoneCallback): Promise<void> {
        try {
            const { essayId, essayContent, promptBody } = job.data as any;

            const feedback = await geminiService.generateFeedback(essayContent, promptBody);

            await essayService.updateEssayFeedback(essayId, feedback);

            job.progress(100);
            done(null, job.data);
        } catch (error) {
            log.error(error);
            done(error as Error);
        }
    }
}

const essayWorker = new EssayWorker();

export default essayWorker;
