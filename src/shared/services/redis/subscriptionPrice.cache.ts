import { ServerError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import { config } from '@root/config';
import { BaseCache } from '@service/redis/base.cache';
import type { SubscriptionType } from '@subscription/interfaces/subscription.interface';
import type Logger from 'bunyan';

const log: Logger = config.createLogger('subscriptionPriceCache');

export class SubscriptionPriceCache extends BaseCache {
    constructor() {
        super('subscriptionPriceCache');
    }

    public async savePricesToCache(prices: any[]): Promise<void> {
        try {
            await this.ensureConnected();

            // Save all prices as a hash
            const pricesData: Record<string, string> = {};
            prices.forEach((price) => {
                pricesData[price.type] = Helpers.convertToRedisValue(price.price);
            });

            await this.client.HSET('subscription-prices', pricesData);
            await this.client.EXPIRE('subscription-prices', 24 * 60 * 60); // 24 hours
        } catch (error) {
            log.error('Error saving subscription prices to cache:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    public async getPricesFromCache(): Promise<any[] | null> {
        try {
            await this.ensureConnected();

            const response = await this.client.HGETALL('subscription-prices');
            if (!response || Object.keys(response).length === 0) return null;

            const prices = Object.entries(response).map(([type, priceValue]) => ({
                type,
                price: Helpers.convertFromRedisValue(priceValue),
            }));

            return prices;
        } catch (error) {
            log.error('Error getting subscription prices from cache:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    public async savePriceToCache(type: SubscriptionType, price: number): Promise<void> {
        try {
            await this.ensureConnected();
            await this.client.HSET('subscription-prices', type, Helpers.convertToRedisValue(price));
            await this.client.EXPIRE('subscription-prices', 24 * 60 * 60);
        } catch (error) {
            log.error('Error saving subscription price to cache:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    public async getPriceByTypeFromCache(type: SubscriptionType): Promise<number | null> {
        try {
            await this.ensureConnected();

            const response = await this.client.HGET('subscription-prices', type);
            if (!response) return null;

            return Helpers.convertFromRedisValue(response) as number;
        } catch (error) {
            log.error('Error getting subscription price from cache:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    public async invalidateCache(): Promise<void> {
        try {
            await this.ensureConnected();
            await this.client.DEL('subscription-prices');
        } catch (error) {
            log.error('Error invalidating subscription prices cache:', error);
            // Don't throw, just log
        }
    }
}

const subscriptionPriceCache = new SubscriptionPriceCache();
export default subscriptionPriceCache;
