import { ServerError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import { config } from '@root/config';
import { BaseCache } from '@service/redis/base.cache';
import type { IUserDocument } from '@user/interfaces/user.interface';
import type Logger from 'bunyan';

const log: Logger = config.createLogger('userCache');

export class UserCache extends BaseCache {
    constructor() {
        super('userCache');
    }

    public async saveUserToCache(
        key: string,
        userUId: string,
        createdUser: IUserDocument
    ): Promise<void> {
        try {
            await this.ensureConnected();

            // Store in sorted set for ordering
            await this.client.ZADD('user', { score: parseInt(userUId, 10), value: key });

            // Convert values field-by-field
            const dataToSave: Record<string, string> = {};
            for (const [field, value] of Object.entries(createdUser)) {
                dataToSave[field] = Helpers.convertToRedisValue(value);
            }

            // Save all fields in one call
            await this.client.HSET(`users:${key}`, dataToSave);
            await this.client.EXPIRE(`users:${key}`, 24 * 60 * 60);
        } catch (error) {
            log.error('Error saving user to cache:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    public async deleteUserFromCache(userObjectId: string, userUId: string): Promise<void> {
        try {
            await this.ensureConnected();

            await this.client.ZREM('user', userObjectId);

            await this.client.DEL(`users:${userObjectId}`);
        } catch (error) {
            log.error('Error deleting user from cache:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    public async getUserFromCache(userId: string): Promise<IUserDocument | null> {
        try {
            await this.ensureConnected();

            const response = await this.client.HGETALL(`users:${userId}`);
            if (!response || Object.keys(response).length === 0) return null;

            // Parse each field individually
            const parsed: any = {};
            for (const [field, value] of Object.entries(response)) {
                parsed[field] = Helpers.convertFromRedisValue(value);
            }

            return parsed as IUserDocument;
        } catch (error) {
            log.error('Error getting user from cache:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    public async updateSingleUserItemInCache(
        userId: string,
        prop: string,
        value: any
    ): Promise<IUserDocument | null> {
        try {
            await this.ensureConnected();

            await this.client.HSET(`users:${userId}`, prop, Helpers.convertToRedisValue(value));
            return this.getUserFromCache(userId);
        } catch (error) {
            log.error('Error updating single user item in cache:', error);
            throw new ServerError('Server error. Try again.');
        }
    }

    public async updateUserInCache(userId: string, property: string, value: any): Promise<void> {
        try {
            await this.updateSingleUserItemInCache(userId, property, value);
        } catch (error) {
            log.error('Error updating user in cache:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }
}

const userCache = new UserCache();
export default userCache;
