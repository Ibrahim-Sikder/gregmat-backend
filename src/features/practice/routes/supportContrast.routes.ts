import authMiddleware from '@global/helpers/auth';
import { SupportContrastController } from '@practice/controllers/supportContrast.controller';
import type { Router } from 'express';
import express from 'express';

class SupportContrastRoutes {
    private router: Router;

    constructor() {
        this.router = express.Router();
    }

    public routes(): Router {
        const controller = new SupportContrastController();

        this.router.get('/support-contrast', authMiddleware.verifyUser, controller.getAll);
        this.router.get('/support-contrast/:id', authMiddleware.verifyUser, controller.getById);
        this.router.post(
            '/support-contrast/attempt',
            authMiddleware.verifyUser,
            controller.submitAttempt
        );
        this.router.post(
            '/support-contrast/reset',
            authMiddleware.verifyUser,
            controller.resetProgress
        );
        this.router.post(
            '/support-contrast/reset-attempt',
            authMiddleware.verifyUser,
            controller.resetAttempt
        );

        return this.router;
    }
}

export const supportContrastRoutes: SupportContrastRoutes = new SupportContrastRoutes();
