import 'reflect-metadata';
import { config } from '@root/config';
import connectToDatabase from '@root/setupDatabase';
import { Server } from '@root/setupServer';
import authQueue from '@service/queues/auth.queue';
import chunkQueue from '@service/queues/chunk.queue';
import type Logger from 'bunyan';
import type { Express } from 'express';
import express from 'express';

const log: Logger = config.createLogger('app');

class Application {
    public async initialize(): Promise<void> {
        this.loadConfig();

        try {
            await connectToDatabase();
        } catch (error) {
            log.error('Database connection failed on startup. Exiting.', error);
            Application.shutDownProperly(1);
            return; // Stop execution
        }

        const app: Express = express();
        const server: Server = new Server(app);
        server.start();

        this.initializeRecurringJobs();
        Application.handleExit();
    }

    private loadConfig(): void {
        config.validateConfig();
    }

    private initializeRecurringJobs(): void {
        authQueue.addRecurringUnblockJob();
        authQueue.addRecurringDeleteUnverifiedJob();
        chunkQueue.addDailyCleanupJob();
        log.info('Recurring jobs initialized');
    }

    private static handleExit(): void {
        process.on('uncaughtException', (error: Error) => {
            log.error(`There was an uncaught error: ${error}`);
            Application.shutDownProperly(1);
        });

        process.on('unhandledRejection', (reason: Error) => {
            log.error(`Unhandled rejection at promise: ${reason}`);
            Application.shutDownProperly(2);
        });

        process.on('SIGTERM', () => {
            log.error('Caught SIGTERM');
            Application.shutDownProperly(2);
        });

        process.on('SIGINT', () => {
            log.error('Caught SIGINT');
            Application.shutDownProperly(2);
        });

        process.on('exit', () => {
            log.error('Exiting');
        });
    }

    public static shutDownProperly(exitCode: number): void {
        Promise.resolve()
            .then(() => {
                log.info(`Application shutting down with exit code ${exitCode}`);
                process.exit(exitCode);
            })
            .catch((error) => {
                log.error(`Error occurred during shutdown: ${error}`);
                process.exit(1);
            });
    }
}

const application = new Application();

application.initialize().catch((error) => {
    log.error('Application failed to execute initialize:', error);
    Application.shutDownProperly(1);
});
