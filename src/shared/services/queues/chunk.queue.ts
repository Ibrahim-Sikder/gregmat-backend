import type { IChunkCleanupJob } from '@gallery/interfaces/video.interface';
import { config } from '@root/config';
import { BaseQueue } from '@service/queues/base.queue';
import chunkWorkers from '@worker/chunk.workers';

const log = config.createLogger('chunkQueue');

class ChunkQueue extends BaseQueue {
    constructor() {
        super('chunk');
        this.processJob('cleanupChunks', 1, chunkWorkers.cleanupChunks);
    }

    public addChunkJob(name: string, data: IChunkCleanupJob): void {
        this.addJob(name, data);
    }

    public addDailyCleanupJob(): void {
        // Run daily at 2:00 AM
        this.queue.add(
            'cleanupChunks',
            { timestamp: new Date() },
            {
                repeat: { cron: '0 2 * * *' },
                attempts: 3,
                backoff: { type: 'fixed', delay: 5000 },
                removeOnComplete: true,
                removeOnFail: false,
            }
        );
        log.info('Daily chunk cleanup job scheduled for 2:00 AM');
    }
}

const chunkQueue = new ChunkQueue();
export default chunkQueue;
