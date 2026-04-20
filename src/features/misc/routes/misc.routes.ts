import adminMiddleware from '@global/helpers/admin';
import authMiddleware from '@global/helpers/auth';
import { Router } from 'express';
import {
    createMiscQuiz,
    deleteMiscQuiz,
    getMiscQuizBySlug,
    getMiscQuizzes,
    updateMiscQuiz,
} from '../controllers/misc.controllers';

class MiscRoutes {
    private router: Router;

    constructor() {
        this.router = Router();
    }

    public routes(): Router {
        this.router.post(
            '/',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            createMiscQuiz
        );
        this.router.get(
            '/',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            getMiscQuizzes
        );
        this.router.get('/:slug', getMiscQuizBySlug);
        this.router.put(
            '/:slug',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            updateMiscQuiz
        );
        this.router.delete(
            '/:slug',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            deleteMiscQuiz
        );

        return this.router;
    }
}

const miscRoutes = new MiscRoutes();

export default miscRoutes;
