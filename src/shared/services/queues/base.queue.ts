import type { IAuthJob } from '@auth/interfaces/auth.interface';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import type { IChunkCleanupJob, IVideoJob } from '@gallery/interfaces/video.interface';
import { config } from '@root/config';
import type { IEmailJob, IUserJob } from '@user/interfaces/user.interface';
import type { Job } from 'bull';
import Queue from 'bull';
import type Logger from 'bunyan';

type IBaseJobData = IAuthJob | IEmailJob | IUserJob | IVideoJob | IChunkCleanupJob;

let bullAdapters: BullAdapter[] = [];
export let serverAdapter: ExpressAdapter;

export abstract class BaseQueue {
    queue: Queue.Queue;

    log: Logger;

    constructor(queueName: string) {
        this.queue = new Queue(queueName, {
            redis: config.REDIS_HOST,
            defaultJobOptions: {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: true,
                removeOnFail: { count: 5 }, // Keep only last 5 failed jobs
            },
            settings: {
                maxStalledCount: 2, // Reduce stalled job retries
                stalledInterval: 30000, // Check for stalled jobs every 30s
                lockDuration: 30000, // Lock job for 30s
            },
        });
        this.log = config.createLogger(`Queue:${queueName}`);
        bullAdapters.push(new BullAdapter(this.queue));
        bullAdapters = [...new Set(bullAdapters)];
        serverAdapter = new ExpressAdapter();
        serverAdapter.setBasePath('/queues');

        createBullBoard({
            queues: bullAdapters,
            serverAdapter,
        });

        // Clean jobs more aggressively to prevent memory buildup
        setInterval(
            async () => {
                try {
                    // Clean jobs older than 10 minutes (reduced from 1 hour)
                    await this.queue.clean(10 * 60 * 1000, 'completed');
                    await this.queue.clean(10 * 60 * 1000, 'failed');
                    await this.queue.clean(30 * 60 * 1000, 'wait'); // 30 min for waiting
                    await this.queue.clean(5 * 60 * 1000, 'active'); // 5 min for stalled

                    this.log.info(`[Queue:${queueName}] Old jobs cleaned`);
                } catch (err) {
                    this.log.error(`Queue cleanup error: ${(err as Error).message}`);
                }
            },
            5 * 60 * 1000
        ); // run every 5 min (increased frequency)

        this.queue.on('completed', (job: Job) => {
            job.remove();
        });

        this.queue.on('global:completed', (jobId: string) => {
            this.log.info(`Job ${jobId} completed`);
        });

        this.queue.on('global:stalled', (jobId: string) => {
            this.log.info(`Job ${jobId} is stalled`);
        });

        this.queue.on('failed', (job: Job, err: Error) => {
            this.log.error(`Job failed: ${job.id}, Error: ${err.message}`);
        });

        this.queue.on('error', (error: Error) => {
            this.log.error(`Queue error: ${error.message}`);
        });
    }

    protected addJob(name: string, data: IBaseJobData, options?: Queue.JobOptions): void {
        this.queue.add(name, data, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
            removeOnComplete: true, // Always remove completed jobs
            removeOnFail: { count: 5 }, // Keep only last 5 failed jobs
            timeout: 300000, // 5 minute timeout for jobs
            ...options,
        });
    }

    protected processJob(
        name: string,
        concurrency: number,
        callback: Queue.ProcessCallbackFunction<void>
    ): void {
        this.queue.process(name, concurrency, callback);
    }
}
