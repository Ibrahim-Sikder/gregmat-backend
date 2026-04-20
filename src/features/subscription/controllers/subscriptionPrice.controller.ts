import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import subscriptionPriceService from '@service/db/subscriptionPrice.service';
import { updateSubscriptionPriceSchema } from '@subscription/schemas/subscriptionPrice';
import type { SubscriptionType } from '@subscription/interfaces/subscription.interface';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class SubscriptionPriceController {
    // Public endpoint - no auth required for viewing prices
    @CatchAsync()
    public async getPrices(req: Request, res: Response): Promise<void> {
        const prices = await subscriptionPriceService.getAllPrices();

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Subscription prices fetched successfully',
            data: prices,
        });
    }

    @CatchAsync()
    public async getPricesMap(req: Request, res: Response): Promise<void> {
        const pricesMap = await subscriptionPriceService.getPricesMap();

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Subscription prices map fetched successfully',
            data: pricesMap,
        });
    }

    // Admin endpoints
    @CatchAsync()
    @ZodValidation(updateSubscriptionPriceSchema)
    public async updatePrice(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;
        const { type, price } = req.body;

        const updatedPrice = await subscriptionPriceService.updatePrice(
            type as SubscriptionType,
            price,
            currentUser!.userId
        );

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Subscription price updated successfully',
            data: updatedPrice,
        });
    }
}

export default SubscriptionPriceController;
