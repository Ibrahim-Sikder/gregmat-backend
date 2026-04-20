import authMiddleware from '@global/helpers/auth';
import EssayController from '@practice/controllers/essay';
import { Router } from 'express';

class EssayRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        this.router.post(
            '/essay/submit',
            authMiddleware.verifyUser,
            EssayController.prototype.submit
        );

        this.router.get(
            '/essay/me',
            authMiddleware.verifyUser,
            EssayController.prototype.getMyEssays
        );

        this.router.get('/essay/:essayId', EssayController.prototype.getById);

        // // Get essays by a specific user (public)
        // this.router.get('/essay/user/:userId', EssayController.prototype.getByUser);

        return this.router;
    }
}

const essayRoutes = new EssayRoutes();

export default essayRoutes;
