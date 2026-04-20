import type { IVideoJob } from '@gallery/interfaces/video.interface';
import videoWorker from '@worker/video.worker';
import { BaseQueue } from './base.queue';

class VideoQueue extends BaseQueue {
    constructor() {
        super('video');
        this.processJob('uploadVideo', 3, videoWorker.uploadVideo);
    }

    public addVideoJob(name: string, data: IVideoJob): void {
        this.addJob(name, {
            videoPath: data.videoPath,
            thumbnailPath: data.thumbnailPath,
            title: data.title,
            roomId: data.roomId,
        });
    }
}

const videoQueue = new VideoQueue();

export default videoQueue;
