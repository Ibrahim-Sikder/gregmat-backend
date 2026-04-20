import adminMiddleware from '@global/helpers/admin';
import authMiddleware from '@global/helpers/auth';
import SubscriptionController from '@subscription/controllers/subscription.controller';
import SubscriptionPriceController from '@subscription/controllers/subscriptionPrice.controller';
import { Router } from 'express';

class SubscriptionRoutes {
    private router: Router;

    constructor() {
        this.router = Router();
    }

    public routes(): Router {
        const subscriptionController = new SubscriptionController();
        const subscriptionPriceController = new SubscriptionPriceController();

        // User routes - require authentication
        this.router.post(
            '/requests',
            authMiddleware.verifyUser,
            subscriptionController.createSubscriptionRequest
        );
        this.router.get(
            '/my/requests',
            authMiddleware.verifyUser,
            subscriptionController.getMySubscriptionRequests
        );
        this.router.get(
            '/my/active',
            authMiddleware.verifyUser,
            subscriptionController.getMyActiveSubscription
        );
        this.router.get(
            '/my/all',
            authMiddleware.verifyUser,
            subscriptionController.getMySubscriptions
        );

        // Admin routes - require authentication and admin role
        // Subscription Requests
        // Subscription Prices (public endpoint for viewing prices)
        this.router.get('/prices', subscriptionPriceController.getPrices);
        this.router.get('/prices/map', subscriptionPriceController.getPricesMap);

        this.router.get(
            '/requests',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            subscriptionController.getAllSubscriptionRequests
        );
        this.router.get(
            '/requests/:requestId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            subscriptionController.getSubscriptionRequestById
        );
        this.router.post(
            '/requests/:requestId/approve',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            subscriptionController.approveSubscriptionRequest
        );
        this.router.post(
            '/requests/:requestId/reject',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            subscriptionController.rejectSubscriptionRequest
        );

        // Subscriptions
        this.router.post(
            '/',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            subscriptionController.createSubscription
        );
        this.router.get(
            '/',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            subscriptionController.getAllSubscriptions
        );
        this.router.get(
            '/active',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            subscriptionController.getAllActiveSubscriptions
        );
        this.router.get(
            '/:subscriptionId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            subscriptionController.getSubscriptionById
        );
        this.router.patch(
            '/:subscriptionId/status',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            subscriptionController.updateSubscriptionStatus
        );
        this.router.patch(
            '/:subscriptionId/price',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            subscriptionController.updateSubscriptionPrice
        );
        this.router.patch(
            '/:subscriptionId/type',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            subscriptionController.updateSubscriptionType
        );
        this.router.post(
            '/:subscriptionId/cancel',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            subscriptionController.cancelSubscription
        );
        this.router.post(
            '/:subscriptionId/renew',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            subscriptionController.renewSubscription
        );
        this.router.get(
            '/user/:userId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            subscriptionController.getUserSubscriptions
        );

        // Subscription Prices (admin only)
        this.router.patch(
            '/prices',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            subscriptionPriceController.updatePrice
        );

        return this.router;
    }
}

const subscriptionRoutes: SubscriptionRoutes = new SubscriptionRoutes();

export default subscriptionRoutes;
