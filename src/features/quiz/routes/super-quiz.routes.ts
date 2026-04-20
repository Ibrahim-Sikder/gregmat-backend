import authMiddleware from '@global/helpers/auth';
import SuperQuizController from '@quiz/controllers/super-quiz';
import { Router } from 'express';

class SuperQuizRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        // Add question to user's super quiz (creates if doesn't exist)
        this.router.post(
            '/add-question',
            authMiddleware.verifyUser,
            SuperQuizController.prototype.addQuestion
        );

        // Remove question from user's super quiz
        this.router.delete(
            '/remove-question/:questionId',
            authMiddleware.verifyUser,
            SuperQuizController.prototype.removeQuestion
        );

        // Get current user's super quiz
        this.router.get(
            '/my-quiz',
            authMiddleware.verifyUser,
            SuperQuizController.prototype.getMySuperQuiz
        );

        // Get super quiz by ID
        this.router.get(
            '/:superQuizId',
            authMiddleware.verifyUser,
            SuperQuizController.prototype.getById
        );

        // Update user's super quiz (title/description only)
        this.router.put('/', authMiddleware.verifyUser, SuperQuizController.prototype.update);

        // Delete user's super quiz
        this.router.delete('/', authMiddleware.verifyUser, SuperQuizController.prototype.delete);

        return this.router;
    }
}

const superQuizRoutes = new SuperQuizRoutes();
export default superQuizRoutes;
