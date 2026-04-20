import adminMiddleware from '@global/helpers/admin';
import authMiddleware from '@global/helpers/auth';
import QuizController from '@quiz/controllers/quiz';
import { Router } from 'express';

class QuizRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        this.router.post(
            '/create',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            QuizController.prototype.create
        );

        this.router.get('/all', authMiddleware.verifyUser, QuizController.prototype.getAll);

        this.router.get('/:quizId', authMiddleware.verifyUser, QuizController.prototype.getById);

        this.router.put(
            '/:quizId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            QuizController.prototype.update
        );

        this.router.delete(
            '/:quizId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            QuizController.prototype.delete
        );

        return this.router;
    }
}

const quizRoutes = new QuizRoutes();
export default quizRoutes;
