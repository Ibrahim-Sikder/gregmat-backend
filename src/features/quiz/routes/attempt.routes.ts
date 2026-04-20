import authMiddleware from '@global/helpers/auth';
import AttemptController from '@quiz/controllers/attempt';
import { Router } from 'express';

class AttemptRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        this.router.post('/create', authMiddleware.verifyUser, AttemptController.prototype.create);

        this.router.get('/all', authMiddleware.verifyUser, AttemptController.prototype.getAll);

        this.router.get(
            '/:attemptId',
            authMiddleware.verifyUser,
            AttemptController.prototype.getById
        );

        this.router.get(
            '/user/:userId',
            authMiddleware.verifyUser,
            AttemptController.prototype.getByUserId
        );

        this.router.get(
            '/user/:userId/stats',
            authMiddleware.verifyUser,
            AttemptController.prototype.getUserStats
        );

        this.router.get(
            '/question/:questionId',
            authMiddleware.verifyUser,
            AttemptController.prototype.getByQuestionId
        );

        this.router.put(
            '/:attemptId',
            authMiddleware.verifyUser,
            AttemptController.prototype.update
        );

        this.router.delete(
            '/:attemptId',
            authMiddleware.verifyUser,
            AttemptController.prototype.delete
        );

        return this.router;
    }
}

const attemptRoutes = new AttemptRoutes();
export default attemptRoutes;
