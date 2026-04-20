import adminMiddleware from '@global/helpers/admin';
import authMiddleware from '@global/helpers/auth';
import QuestionController from '@quiz/controllers/question';
import { Router } from 'express';

class QuestionRoutes {
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
            QuestionController.prototype.create
        );

        this.router.get('/all', authMiddleware.verifyUser, QuestionController.prototype.getAll);

        this.router.get(
            '/:questionId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            QuestionController.prototype.getById
        );

        this.router.get(
            '/quiz/:quizId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            QuestionController.prototype.getByQuizId
        );

        this.router.put(
            '/:questionId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            QuestionController.prototype.update
        );

        this.router.delete(
            '/:questionId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            QuestionController.prototype.delete
        );

        return this.router;
    }
}

const questionRoutes = new QuestionRoutes();
export default questionRoutes;
