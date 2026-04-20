import { ServerError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import { config } from '@root/config';
import { BaseCache } from '@service/redis/base.cache';
import type { ISubscriptionDocument } from '@subscription/interfaces/subscription.interface';
import type Logger from 'bunyan';

const log: Logger = config.createLogger('subscriptionCache');

export class SubscriptionCache extends BaseCache {
    constructor() {
        super('subscriptionCache');
    }

    public async saveSubscriptionToCache(
        key: string,
        subscription: ISubscriptionDocument
    ): Promise<void> {
        try {
            await this.ensureConnected();

            const dataToSave: Record<string, string> = {};
            for (const [field, value] of Object.entries(subscription)) {
                dataToSave[field] = Helpers.convertToRedisValue(value);
            }

            await this.client.HSET(`subscriptions:${key}`, dataToSave);
            await this.client.EXPIRE(`subscriptions:${key}`, 24 * 60 * 60); // 24 hours
        } catch (error) {
            log.error('Error saving subscription to cache:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    public async getSubscriptionFromCache(
        subscriptionId: string
    ): Promise<ISubscriptionDocument | null> {
        try {
            await this.ensureConnected();

            const response = await this.client.HGETALL(`subscriptions:${subscriptionId}`);
            if (!response || Object.keys(response).length === 0) return null;

            const parsed: any = {};
            for (const [field, value] of Object.entries(response)) {
                parsed[field] = Helpers.convertFromRedisValue(value);
            }

            return parsed as ISubscriptionDocument;
        } catch (error) {
            log.error('Error getting subscription from cache:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    public async deleteSubscriptionFromCache(subscriptionId: string): Promise<void> {
        try {
            await this.ensureConnected();
            await this.client.DEL(`subscriptions:${subscriptionId}`);
        } catch (error) {
            log.error('Error deleting subscription from cache:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    public async saveUserActiveSubscriptionToCache(
        userId: string,
        subscription: ISubscriptionDocument | null
    ): Promise<void> {
        try {
            await this.ensureConnected();

            if (!subscription) {
                await this.client.DEL(`user:${userId}:active-subscription`);
                return;
            }

            const dataToSave: Record<string, string> = {};
            for (const [field, value] of Object.entries(subscription)) {
                dataToSave[field] = Helpers.convertToRedisValue(value);
            }

            await this.client.HSET(`user:${userId}:active-subscription`, dataToSave);
            await this.client.EXPIRE(`user:${userId}:active-subscription`, 24 * 60 * 60); // 24 hours
        } catch (error) {
            log.error('Error saving user active subscription to cache:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    public async getUserActiveSubscriptionFromCache(
        userId: string
    ): Promise<ISubscriptionDocument | null> {
        try {
            await this.ensureConnected();

            const response = await this.client.HGETALL(`user:${userId}:active-subscription`);
            if (!response || Object.keys(response).length === 0) return null;

            const parsed: any = {};
            for (const [field, value] of Object.entries(response)) {
                parsed[field] = Helpers.convertFromRedisValue(value);
            }

            return parsed as ISubscriptionDocument;
        } catch (error) {
            log.error('Error getting user active subscription from cache:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    public async invalidateUserSubscriptionCache(userId: string): Promise<void> {
        try {
            await this.ensureConnected();
            await this.client.DEL(`user:${userId}:active-subscription`);
        } catch (error) {
            log.error('Error invalidating user subscription cache:', error);
            // Don't throw, just log - cache invalidation failures shouldn't break the app
        }
    }
}

const subscriptionCache = new SubscriptionCache();
export default subscriptionCache;
