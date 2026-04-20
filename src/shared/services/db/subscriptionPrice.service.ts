import { BadRequestError, NotFoundError } from '@global/helpers/error-handlers';
import subscriptionPriceCache from '@service/redis/subscriptionPrice.cache';
import { SubscriptionType } from '@subscription/interfaces/subscription.interface';
import SubscriptionPriceModel from '@subscription/models/subscriptionPrice.schema';

class SubscriptionPriceService {
    private subscriptionPriceModel = SubscriptionPriceModel;

    /**
     * Get all subscription prices
     */
    public async getAllPrices(): Promise<any[]> {
        // Try cache first
        const cached = await subscriptionPriceCache.getPricesFromCache();
        if (cached && cached.length > 0) {
            return cached;
        }

        const prices = await this.subscriptionPriceModel.find().exec();

        if (prices.length > 0) {
            await subscriptionPriceCache.savePricesToCache(prices);
        }

        return prices;
    }

    /**
     * Get price for a specific subscription type
     */
    public async getPriceByType(type: SubscriptionType): Promise<number | null> {
        // Try cache first
        const cachedPrice = await subscriptionPriceCache.getPriceByTypeFromCache(type);
        if (cachedPrice !== null) {
            return cachedPrice;
        }

        const priceDoc = await this.subscriptionPriceModel.findOne({ type }).exec();

        if (priceDoc) {
            await subscriptionPriceCache.savePriceToCache(type, priceDoc.price);
            return priceDoc.price;
        }

        return null;
    }

    /**
     * Update price for a subscription type
     */
    public async updatePrice(
        type: SubscriptionType,
        price: number,
        updatedBy?: string
    ): Promise<any> {
        if (price < 0) {
            throw new BadRequestError('Price must be non-negative');
        }

        if (type !== SubscriptionType.GREGMAT && type !== SubscriptionType.GREGMAT_PREPSWIFT) {
            throw new BadRequestError('Invalid subscription type');
        }

        const priceDoc = await this.subscriptionPriceModel
            .findOneAndUpdate({ type }, { price, updatedBy }, { upsert: true, new: true })
            .exec();

        // Invalidate cache and refresh all prices
        await subscriptionPriceCache.invalidateCache();

        // Fetch all prices from DB and save to cache
        const allPrices = await this.subscriptionPriceModel.find().exec();
        if (allPrices.length > 0) {
            await subscriptionPriceCache.savePricesToCache(allPrices);
        }

        return priceDoc;
    }

    /**
     * Get all prices as a map
     */
    public async getPricesMap(): Promise<Record<SubscriptionType, number>> {
        const prices = await this.getAllPrices();
        const pricesMap: Record<string, number> = {};

        prices.forEach((price: any) => {
            pricesMap[price.type] = price.price;
        });

        // Ensure both types are in the map (with defaults if not found)
        if (!pricesMap[SubscriptionType.GREGMAT]) {
            pricesMap[SubscriptionType.GREGMAT] = 7.99; // Default
        }
        if (!pricesMap[SubscriptionType.GREGMAT_PREPSWIFT]) {
            pricesMap[SubscriptionType.GREGMAT_PREPSWIFT] = 9.99; // Default
        }

        return pricesMap as Record<SubscriptionType, number>;
    }
}

const subscriptionPriceService = new SubscriptionPriceService();
export default subscriptionPriceService;
