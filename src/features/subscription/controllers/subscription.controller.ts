import { CatchAsync } from '@global/decorators/catch-async';
import { BadRequestError, NotFoundError } from '@global/helpers/error-handlers';
import sendResponse from '@global/helpers/sendResponse';
import { ZodValidation } from '@global/decorators/zod-validation';
import subscriptionService from '@service/db/subscription.service';
import {
    approveSubscriptionRequestSchema,
    createSubscriptionRequestSchema,
    createSubscriptionSchema,
    renewSubscriptionSchema,
    updateSubscriptionStatusSchema,
    updateSubscriptionPriceSchema,
    updateSubscriptionTypeSchema,
} from '@subscription/schemas/subscription';
import {
    SubscriptionStatus,
    SubscriptionType,
} from '@subscription/interfaces/subscription.interface';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class SubscriptionController {
    // User endpoints

    @CatchAsync()
    @ZodValidation(createSubscriptionRequestSchema)
    public async createSubscriptionRequest(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;
        const { type, message } = req.body;

        const request = await subscriptionService.createSubscriptionRequest(
            currentUser!.userId,
            type,
            message
        );

        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Subscription request created successfully',
            data: request,
        });
    }

    @CatchAsync()
    public async getMySubscriptionRequests(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;

        const requests = await subscriptionService.getSubscriptionRequests(
            undefined,
            currentUser!.userId
        );

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Subscription requests fetched successfully',
            data: requests,
        });
    }

    @CatchAsync()
    public async getMyActiveSubscription(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;

        const subscription = await subscriptionService.getActiveSubscription(currentUser!.userId);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: subscription
                ? 'Active subscription fetched successfully'
                : 'No active subscription found',
            data: subscription,
        });
    }

    @CatchAsync()
    public async getMySubscriptions(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;

        const subscriptions = await subscriptionService.getUserSubscriptions(currentUser!.userId);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Subscriptions fetched successfully',
            data: subscriptions,
        });
    }

    // Admin endpoints

    @CatchAsync()
    public async getAllSubscriptionRequests(req: Request, res: Response): Promise<void> {
        const { status } = req.query;

        const requests = await subscriptionService.getSubscriptionRequests(
            status as string | undefined
        );

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Subscription requests fetched successfully',
            data: requests,
        });
    }

    @CatchAsync()
    public async getSubscriptionRequestById(req: Request, res: Response): Promise<void> {
        const { requestId } = req.params;

        const request = await subscriptionService.getSubscriptionRequestById(requestId);

        if (!request) {
            throw new NotFoundError('Subscription request not found');
        }

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Subscription request fetched successfully',
            data: request,
        });
    }

    @CatchAsync()
    @ZodValidation(approveSubscriptionRequestSchema)
    public async approveSubscriptionRequest(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;
        const { requestId } = req.params;
        const { price } = req.body;

        const result = await subscriptionService.approveSubscriptionRequest(
            requestId,
            currentUser!.userId,
            price
        );

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Subscription request approved and subscription created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async rejectSubscriptionRequest(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;
        const { requestId } = req.params;

        const request = await subscriptionService.rejectSubscriptionRequest(
            requestId,
            currentUser!.userId
        );

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Subscription request rejected successfully',
            data: request,
        });
    }

    @CatchAsync()
    @ZodValidation(createSubscriptionSchema)
    public async createSubscription(req: Request, res: Response): Promise<void> {
        const { userId, type, price, startDate } = req.body;

        const subscription = await subscriptionService.createSubscription(
            userId,
            type,
            price,
            startDate
        );

        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Subscription created successfully',
            data: subscription,
        });
    }

    @CatchAsync()
    public async getAllSubscriptions(req: Request, res: Response): Promise<void> {
        const subscriptions = await subscriptionService.getAllSubscriptions();

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Subscriptions fetched successfully',
            data: subscriptions,
        });
    }

    @CatchAsync()
    public async getAllActiveSubscriptions(req: Request, res: Response): Promise<void> {
        const subscriptions = await subscriptionService.getAllActiveSubscriptions();

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Active subscriptions fetched successfully',
            data: subscriptions,
        });
    }

    @CatchAsync()
    public async getSubscriptionById(req: Request, res: Response): Promise<void> {
        const { subscriptionId } = req.params;

        const subscription = await subscriptionService.getSubscriptionById(subscriptionId);

        if (!subscription) {
            throw new NotFoundError('Subscription not found');
        }

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Subscription fetched successfully',
            data: subscription,
        });
    }

    @CatchAsync()
    @ZodValidation(updateSubscriptionStatusSchema)
    public async updateSubscriptionStatus(req: Request, res: Response): Promise<void> {
        const { subscriptionId } = req.params;
        const { status } = req.body;

        const subscription = await subscriptionService.updateSubscriptionStatus(
            subscriptionId,
            status as SubscriptionStatus
        );

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Subscription status updated successfully',
            data: subscription,
        });
    }

    @CatchAsync()
    public async cancelSubscription(req: Request, res: Response): Promise<void> {
        const { subscriptionId } = req.params;

        const subscription = await subscriptionService.cancelSubscription(subscriptionId);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Subscription cancelled successfully',
            data: subscription,
        });
    }

    @CatchAsync()
    @ZodValidation(renewSubscriptionSchema)
    public async renewSubscription(req: Request, res: Response): Promise<void> {
        const { subscriptionId } = req.params;
        const { price } = req.body;

        const { expiredSubscription, newSubscription } =
            await subscriptionService.renewSubscription(subscriptionId, price);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message:
                'Subscription renewed successfully. A new subscription period has been created.',
            data: {
                expiredSubscription,
                newSubscription,
            },
        });
    }

    @CatchAsync()
    public async getUserSubscriptions(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;

        const subscriptions = await subscriptionService.getUserSubscriptions(userId);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'User subscriptions fetched successfully',
            data: subscriptions,
        });
    }

    @CatchAsync()
    @ZodValidation(updateSubscriptionPriceSchema)
    public async updateSubscriptionPrice(req: Request, res: Response): Promise<void> {
        const { subscriptionId } = req.params;
        const { price } = req.body;

        const subscription = await subscriptionService.updateSubscriptionPrice(
            subscriptionId,
            price
        );

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Subscription price updated successfully',
            data: subscription,
        });
    }

    @CatchAsync()
    @ZodValidation(updateSubscriptionTypeSchema)
    public async updateSubscriptionType(req: Request, res: Response): Promise<void> {
        const { subscriptionId } = req.params;
        const { type } = req.body;

        const subscription = await subscriptionService.updateSubscriptionType(
            subscriptionId,
            type as SubscriptionType
        );

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Subscription type updated successfully',
            data: subscription,
        });
    }
}

export default SubscriptionController;
