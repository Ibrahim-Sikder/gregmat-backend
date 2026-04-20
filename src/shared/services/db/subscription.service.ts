import { BadRequestError, NotFoundError } from '@global/helpers/error-handlers';
import subscriptionCache from '@service/redis/subscription.cache';
import type { ISubscriptionDocument } from '@subscription/interfaces/subscription.interface';
import {
    SubscriptionRequestStatus,
    SubscriptionStatus,
    SubscriptionType,
} from '@subscription/interfaces/subscription.interface';
import SubscriptionModel from '@subscription/models/subscription.schema';
import SubscriptionRequestModel from '@subscription/models/subscriptionRequest.schema';
import moment from 'moment';

class SubscriptionService {
    private subscriptionModel = SubscriptionModel;
    private subscriptionRequestModel = SubscriptionRequestModel;

    /**
     * Create a new subscription for a user
     */
    public async createSubscription(
        userId: string,
        type: SubscriptionType,
        price: number,
        startDate?: Date
    ): Promise<ISubscriptionDocument> {
        // Validate subscription type - users cannot subscribe to PrepSwift alone
        if (type !== SubscriptionType.GREGMAT && type !== SubscriptionType.GREGMAT_PREPSWIFT) {
            throw new BadRequestError(
                'Invalid subscription type. Must be either gregmat or gregmat_prepswift'
            );
        }

        // Validate price
        if (price < 0) {
            throw new BadRequestError('Price must be non-negative');
        }

        const start = startDate || new Date();
        const endDate = moment(start).add(1, 'month').toDate();

        // Check if user has an active subscription
        const activeSubscription = await this.getActiveSubscription(userId);
        if (activeSubscription) {
            throw new BadRequestError('User already has an active subscription');
        }

        const subscription = await this.subscriptionModel.create({
            user: userId,
            type,
            price,
            startDate: start,
            endDate,
            status: SubscriptionStatus.ACTIVE,
        });

        // Populate user reference
        await subscription.populate('user', 'username email');

        // Save to cache
        await subscriptionCache.saveSubscriptionToCache(subscription._id.toString(), subscription);
        await subscriptionCache.saveUserActiveSubscriptionToCache(userId, subscription);

        return subscription;
    }

    /**
     * Get active subscription for a user
     */
    public async getActiveSubscription(userId: string): Promise<ISubscriptionDocument | null> {
        // Try cache first
        const cached = await subscriptionCache.getUserActiveSubscriptionFromCache(userId);
        if (cached) {
            // Check if subscription is still valid
            const endDate = new Date(cached.endDate);
            if (endDate > new Date() && cached.status === SubscriptionStatus.ACTIVE) {
                return cached;
            }
            // If expired, invalidate cache
            await subscriptionCache.invalidateUserSubscriptionCache(userId);
        }

        const subscription = await this.subscriptionModel
            .findOne({
                user: userId,
                status: SubscriptionStatus.ACTIVE,
                endDate: { $gt: new Date() },
            })
            .populate('user', 'username email')
            .sort({ createdAt: -1 })
            .exec();

        if (subscription) {
            await subscriptionCache.saveSubscriptionToCache(
                subscription._id.toString(),
                subscription
            );
            await subscriptionCache.saveUserActiveSubscriptionToCache(userId, subscription);
        } else {
            // Cache null to prevent repeated DB queries
            await subscriptionCache.saveUserActiveSubscriptionToCache(userId, null);
        }

        return subscription;
    }

    /**
     * Get subscription by ID
     */
    public async getSubscriptionById(
        subscriptionId: string
    ): Promise<ISubscriptionDocument | null> {
        // Try cache first
        const cached = await subscriptionCache.getSubscriptionFromCache(subscriptionId);
        if (cached) {
            return cached;
        }

        const subscription = await this.subscriptionModel
            .findById(subscriptionId)
            .populate('user', 'username email')
            .exec();

        if (subscription) {
            await subscriptionCache.saveSubscriptionToCache(subscriptionId, subscription);
        }

        return subscription;
    }

    /**
     * Get all subscriptions for a user
     */
    public async getUserSubscriptions(userId: string): Promise<ISubscriptionDocument[]> {
        return await this.subscriptionModel
            .find({ user: userId })
            .populate('user', 'username email')
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * Update subscription status
     */
    public async updateSubscriptionStatus(
        subscriptionId: string,
        status: SubscriptionStatus
    ): Promise<ISubscriptionDocument> {
        const subscription = await this.subscriptionModel.findById(subscriptionId).exec();

        if (!subscription) {
            throw new NotFoundError('Subscription not found');
        }

        subscription.status = status;
        await subscription.save();

        // Invalidate cache
        await subscriptionCache.deleteSubscriptionFromCache(subscriptionId);
        await subscriptionCache.invalidateUserSubscriptionCache(subscription.user.toString());

        return subscription;
    }

    /**
     * Update subscription price
     */
    public async updateSubscriptionPrice(
        subscriptionId: string,
        newPrice: number
    ): Promise<ISubscriptionDocument> {
        if (newPrice < 0) {
            throw new BadRequestError('Price must be non-negative');
        }

        const subscription = await this.subscriptionModel.findById(subscriptionId).exec();

        if (!subscription) {
            throw new NotFoundError('Subscription not found');
        }

        subscription.price = newPrice;
        await subscription.save();

        // Populate user reference
        await subscription.populate('user', 'username email');

        // Invalidate cache
        await subscriptionCache.deleteSubscriptionFromCache(subscriptionId);
        await subscriptionCache.invalidateUserSubscriptionCache(subscription.user.toString());

        // Update cache with new data
        await subscriptionCache.saveSubscriptionToCache(subscriptionId, subscription);
        if (subscription.status === SubscriptionStatus.ACTIVE) {
            await subscriptionCache.saveUserActiveSubscriptionToCache(
                subscription.user.toString(),
                subscription
            );
        }

        return subscription;
    }

    /**
     * Update subscription type (e.g., from gregmat to gregmat_prepswift)
     */
    public async updateSubscriptionType(
        subscriptionId: string,
        newType: SubscriptionType
    ): Promise<ISubscriptionDocument> {
        const subscription = await this.subscriptionModel.findById(subscriptionId).exec();

        if (!subscription) {
            throw new NotFoundError('Subscription not found');
        }

        // Only allow type updates for active subscriptions
        if (subscription.status !== SubscriptionStatus.ACTIVE) {
            throw new BadRequestError('Can only update type for active subscriptions');
        }

        // Validate subscription type
        if (
            newType !== SubscriptionType.GREGMAT &&
            newType !== SubscriptionType.GREGMAT_PREPSWIFT
        ) {
            throw new BadRequestError(
                'Invalid subscription type. Must be either gregmat or gregmat_prepswift'
            );
        }

        subscription.type = newType;
        await subscription.save();

        // Populate user reference
        await subscription.populate('user', 'username email');

        // Invalidate cache
        await subscriptionCache.deleteSubscriptionFromCache(subscriptionId);
        await subscriptionCache.invalidateUserSubscriptionCache(subscription.user.toString());

        // Update cache with new data
        await subscriptionCache.saveSubscriptionToCache(subscriptionId, subscription);
        await subscriptionCache.saveUserActiveSubscriptionToCache(
            subscription.user.toString(),
            subscription
        );

        return subscription;
    }

    /**
     * Cancel a subscription
     */
    public async cancelSubscription(subscriptionId: string): Promise<ISubscriptionDocument> {
        return await this.updateSubscriptionStatus(subscriptionId, SubscriptionStatus.CANCELLED);
    }

    /**
     * Renew subscription (creates a new subscription for the next period)
     * Marks the current subscription as expired and creates a new active subscription
     */
    public async renewSubscription(
        subscriptionId: string,
        newPrice?: number
    ): Promise<{
        expiredSubscription: ISubscriptionDocument;
        newSubscription: ISubscriptionDocument;
    }> {
        const oldSubscription = await this.subscriptionModel.findById(subscriptionId).exec();

        if (!oldSubscription) {
            throw new NotFoundError('Subscription not found');
        }

        if (oldSubscription.status !== SubscriptionStatus.ACTIVE) {
            throw new BadRequestError('Can only renew active subscriptions');
        }

        // Validate price if provided
        const renewalPrice = newPrice !== undefined ? newPrice : oldSubscription.price;
        if (renewalPrice < 0) {
            throw new BadRequestError('Price must be non-negative');
        }

        // Mark old subscription as expired
        oldSubscription.status = SubscriptionStatus.EXPIRED;
        await oldSubscription.save();

        // Create new subscription starting from the end date of the old subscription
        const startDate = oldSubscription.endDate;
        const newEndDate = moment(startDate).add(1, 'month').toDate();

        const newSubscription = await this.subscriptionModel.create({
            user: oldSubscription.user,
            type: oldSubscription.type,
            price: renewalPrice,
            startDate: startDate,
            endDate: newEndDate,
            status: SubscriptionStatus.ACTIVE,
        });

        // Populate user reference
        await newSubscription.populate('user', 'username email');

        // Invalidate cache for old subscription
        await subscriptionCache.deleteSubscriptionFromCache(subscriptionId);
        await subscriptionCache.invalidateUserSubscriptionCache(oldSubscription.user.toString());

        // Cache the new subscription
        await subscriptionCache.saveSubscriptionToCache(
            newSubscription._id.toString(),
            newSubscription
        );
        await subscriptionCache.saveUserActiveSubscriptionToCache(
            oldSubscription.user.toString(),
            newSubscription
        );

        return {
            expiredSubscription: oldSubscription,
            newSubscription,
        };
    }

    /**
     * Create a subscription request
     */
    public async createSubscriptionRequest(
        userId: string,
        type: SubscriptionType,
        message?: string
    ): Promise<any> {
        // Validate subscription type - users cannot subscribe to PrepSwift alone
        if (type !== SubscriptionType.GREGMAT && type !== SubscriptionType.GREGMAT_PREPSWIFT) {
            throw new BadRequestError(
                'Invalid subscription type. Users cannot subscribe to PrepSwift alone.'
            );
        }

        // Check if user already has a pending request
        const existingPendingRequest = await this.subscriptionRequestModel
            .findOne({
                user: userId,
                status: SubscriptionRequestStatus.PENDING,
            })
            .exec();

        if (existingPendingRequest) {
            throw new BadRequestError('You already have a pending subscription request');
        }

        const request = await this.subscriptionRequestModel.create({
            user: userId,
            type,
            message,
            status: SubscriptionRequestStatus.PENDING,
        });

        return await request.populate('user', 'username email');
    }

    /**
     * Get subscription requests
     */
    public async getSubscriptionRequests(status?: string, userId?: string): Promise<any[]> {
        const query: any = {};

        if (status) {
            query.status = status;
        }

        if (userId) {
            query.user = userId;
        }

        return await this.subscriptionRequestModel
            .find(query)
            .populate('user', 'username email')
            .populate('reviewedBy', 'username email')
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * Get subscription request by ID
     */
    public async getSubscriptionRequestById(requestId: string): Promise<any | null> {
        return await this.subscriptionRequestModel
            .findById(requestId)
            .populate('user', 'username email')
            .populate('reviewedBy', 'username email')
            .exec();
    }

    /**
     * Approve subscription request and create subscription
     */
    public async approveSubscriptionRequest(
        requestId: string,
        adminId: string,
        price: number
    ): Promise<{ request: any; subscription: ISubscriptionDocument }> {
        const request = (await this.subscriptionRequestModel.findById(requestId).exec()) as any;

        if (!request) {
            throw new NotFoundError('Subscription request not found');
        }

        if (request.status !== SubscriptionRequestStatus.PENDING) {
            throw new BadRequestError('Request has already been processed');
        }

        // Validate price
        if (price < 0) {
            throw new BadRequestError('Price must be non-negative');
        }

        // Update request status
        request.status = SubscriptionRequestStatus.APPROVED;
        request.reviewedBy = adminId;
        request.reviewedAt = new Date();
        await request.save();

        // Create subscription
        const subscription = await this.createSubscription(
            request.user.toString(),
            request.type,
            price
        );

        return {
            request: await request
                .populate('user', 'username email')
                .populate('reviewedBy', 'username email'),
            subscription,
        };
    }

    /**
     * Reject subscription request
     */
    public async rejectSubscriptionRequest(requestId: string, adminId: string): Promise<any> {
        const request = (await this.subscriptionRequestModel.findById(requestId).exec()) as any;

        if (!request) {
            throw new NotFoundError('Subscription request not found');
        }

        if (request.status !== SubscriptionRequestStatus.PENDING) {
            throw new BadRequestError('Request has already been processed');
        }

        request.status = SubscriptionRequestStatus.REJECTED;
        request.reviewedBy = adminId;
        request.reviewedAt = new Date();
        await request.save();

        return await request
            .populate('user', 'username email')
            .populate('reviewedBy', 'username email');
    }

    /**
     * Get all active subscriptions (admin only)
     */
    public async getAllActiveSubscriptions(): Promise<ISubscriptionDocument[]> {
        return await this.subscriptionModel
            .find({ status: SubscriptionStatus.ACTIVE, endDate: { $gt: new Date() } })
            .populate('user', 'username email')
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * Get all subscriptions (admin only)
     */
    public async getAllSubscriptions(): Promise<ISubscriptionDocument[]> {
        return await this.subscriptionModel
            .find({})
            .populate('user', 'username email')
            .sort({ createdAt: -1 })
            .exec();
    }

    /**
     * Check if user has access to a feature
     */
    public async hasAccess(userId: string, feature: 'gregmat' | 'prepswift'): Promise<boolean> {
        const subscription = await this.getActiveSubscription(userId);

        if (!subscription) {
            return false;
        }

        if (subscription.status !== SubscriptionStatus.ACTIVE) {
            return false;
        }

        if (feature === 'gregmat') {
            return (
                subscription.type === SubscriptionType.GREGMAT ||
                subscription.type === SubscriptionType.GREGMAT_PREPSWIFT
            );
        }

        if (feature === 'prepswift') {
            return subscription.type === SubscriptionType.GREGMAT_PREPSWIFT;
        }

        return false;
    }
}

const subscriptionService = new SubscriptionService();
export default subscriptionService;
