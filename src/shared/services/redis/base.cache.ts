import { createClient } from 'redis';
import type Logger from 'bunyan';
import { config } from '@root/config';

export type RedisClient = ReturnType<typeof createClient>;

export abstract class BaseCache {
    client: RedisClient;

    log: Logger;

    constructor(cacheName: string) {
        this.client = createClient({
            url: config.REDIS_HOST,
            socket: {
                connectTimeout: 10000,
                keepAlive: true,
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        return new Error('Redis connection retry limit exceeded');
                    }
                    return Math.min(retries * 50, 2000);
                },
            },
        });
        this.log = config.createLogger(cacheName);
        this.cacheError();
    }

    private cacheError(): void {
        this.client.on('error', (error: unknown) => {
            this.log.error(error);
        });
    }

    protected async ensureConnected(): Promise<void> {
        if (!this.client.isOpen) await this.client.connect();
    }
}
