import adminMiddleware from '@global/helpers/admin';
import authMiddleware from '@global/helpers/auth';
import UnitController from '@studyPlan/controllers/unit';
import { Router } from 'express';

class UnitRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        this.router.post(
            '/units/create',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            UnitController.prototype.create
        );

        this.router.get('/units/all', authMiddleware.verifyUser, UnitController.prototype.getAll);

        this.router.get(
            '/units/section/:sectionId',
            authMiddleware.verifyUser,
            UnitController.prototype.getUnitsBySectionId
        );

        this.router.get(
            '/units/:unitId',
            authMiddleware.verifyUser,
            UnitController.prototype.getById
        );

        this.router.put(
            '/units/:unitId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            UnitController.prototype.update
        );

        this.router.delete(
            '/units/:unitId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            UnitController.prototype.delete
        );

        return this.router;
    }
}

const unitRoutes = new UnitRoutes();

export default unitRoutes;
