import authMiddleware from '@global/helpers/auth';
import { ProblemController } from '@practice/controllers/problem.controller';
import { Router } from 'express';

class ProblemRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
    }

    public routes(): Router {
        this.router.get(
            '/problems',
            authMiddleware.verifyUser,
            ProblemController.prototype.getProblems
        );

        this.router.get(
            '/problems/:id',
            authMiddleware.verifyUser,
            ProblemController.prototype.getProblem
        );

        this.router.post(
            '/problems/create',
            authMiddleware.verifyUser,
            ProblemController.prototype.createProblem
        );

        this.router.put(
            '/problems/:id',
            authMiddleware.verifyUser,
            ProblemController.prototype.updateProblem
        );

        this.router.delete(
            '/problems/:id',
            authMiddleware.verifyUser,
            ProblemController.prototype.deleteProblem
        );

        // User actions
        this.router.post(
            '/problems/attempt',
            authMiddleware.verifyUser,
            ProblemController.prototype.submitAttempt
        );

        this.router.post(
            '/problems/:id/reset-attempts',
            authMiddleware.verifyUser,
            ProblemController.prototype.resetAttempts
        );

        this.router.post(
            '/problems/:id/like',
            authMiddleware.verifyUser,
            ProblemController.prototype.toggleLike
        );

        this.router.post(
            '/problems/:id/dislike',
            authMiddleware.verifyUser,
            ProblemController.prototype.toggleDislike
        );

        this.router.post(
            '/problems/:id/bookmark',
            authMiddleware.verifyUser,
            ProblemController.prototype.toggleBookmark
        );

        return this.router;
    }
}

const problemRoutes = new ProblemRoutes();
export default problemRoutes;
