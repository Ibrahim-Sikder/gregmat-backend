import { Router } from 'express';
import { DashboardController } from '@dashboard/controllers/dashboard.controller';
import authMiddleware from '@global/helpers/auth';
import adminMiddleware from '@global/helpers/admin';

class DashboardRoutes {
    private router: Router;

    constructor() {
        this.router = Router();
    }

    public routes(): Router {
        this.router.get(
            '/dashboard/stats',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            DashboardController.prototype.getStats
        );
        return this.router;
    }
}

export const dashboardRoutes: DashboardRoutes = new DashboardRoutes();
