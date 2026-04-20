import { config } from '@root/config';
import { redisConnection } from '@service/redis/redis.connection';
import type Logger from 'bunyan';
import mongoose from 'mongoose';

const log: Logger = config.createLogger('setupDatabase');

const connectToDatabase = (): Promise<void> => {
    const dbURI: string = config.DATABASE_URL!;

    mongoose.connection.on('connected', () => {
        log.info('Mongoose default connection open to database');
    });

    mongoose.connection.on('error', (err: Error) => {
        log.error('Mongoose default connection error: ' + err);
    });

    mongoose.connection.on('disconnected', () => {
        log.warn('Mongoose default connection disconnected');
    });

    const options = {
        maxPoolSize: 100, // Increased from 20 for better concurrency
        minPoolSize: 10, // Keep minimum connections ready
        maxIdleTimeMS: 30000, // Close idle connections after 30s
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000, // Socket timeout
        connectTimeoutMS: 10000, // Connection timeout
        retryWrites: true,
        retryReads: true,
    };

    return new Promise((resolve, reject) => {
        let isConnected = false;

        const connect = (): void => {
            mongoose
                .connect(dbURI, options)
                .then(() => {
                    log.info('Successfully connected to MongoDB.');
                    redisConnection.connect();
                    isConnected = true;
                    resolve();
                })
                .catch((error) => {
                    log.error('Error connecting to database. Retrying in 5s...', error);
                    if (!isConnected) {
                        setTimeout(connect, 5000);
                    } else {
                        reject(error);
                    }
                });
        };

        connect();
    });
};

export default connectToDatabase;
