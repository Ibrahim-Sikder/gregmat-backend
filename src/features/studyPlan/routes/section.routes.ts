import adminMiddleware from '@global/helpers/admin';
import authMiddleware from '@global/helpers/auth';
import SectionController from '@studyPlan/controllers/section';
import { Router } from 'express';

class SectionRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        this.router.post(
            '/sections/create',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            SectionController.prototype.create
        );

        this.router.get('/sections/all', SectionController.prototype.getAll);

        this.router.get('/sections/plan/:planId', SectionController.prototype.getByPlanId);

        this.router.get('/sections/:sectionId', SectionController.prototype.getById);

        this.router.put(
            '/sections/:sectionId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            SectionController.prototype.update
        );

        this.router.delete(
            '/sections/:sectionId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            SectionController.prototype.delete
        );

        return this.router;
    }
}

const sectionRoutes = new SectionRoutes();

export default sectionRoutes;
