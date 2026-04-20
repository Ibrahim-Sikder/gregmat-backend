import adminMiddleware from '@global/helpers/admin';
import authMiddleware from '@global/helpers/auth';
import StudyPlanController from '@studyPlan/controllers/plan';
import { Router } from 'express';

class StudyPlanRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        this.router.post(
            '/plans/create',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            StudyPlanController.prototype.create
        );

        this.router.get('/plans/all', StudyPlanController.prototype.getAll);

        this.router.get('/plans/:planId', StudyPlanController.prototype.getById);

        this.router.put(
            '/plans/:planId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            StudyPlanController.prototype.update
        );

        this.router.delete(
            '/plans/:planId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            StudyPlanController.prototype.delete
        );

        return this.router;
    }
}

const planRoutes = new StudyPlanRoutes();

export default planRoutes;
