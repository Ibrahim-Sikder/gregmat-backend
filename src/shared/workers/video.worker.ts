import { config } from '@root/config';
import galleryService from '@service/db/gallery.service';
import type { DoneCallback, Job } from 'bull';
import type Logger from 'bunyan';

const log: Logger = config.createLogger('videoWorker');

class VideoWorker {
    async uploadVideo(job: Job, done: DoneCallback): Promise<void> {
        try {
            const { data } = job;
            await galleryService.createVideo(data);
            job.progress(100);
            done(null, job.data);
        } catch (error) {
            log.error(error);
            done(error as Error);
        }
    }
}

const videoWorker = new VideoWorker();
export default videoWorker;
