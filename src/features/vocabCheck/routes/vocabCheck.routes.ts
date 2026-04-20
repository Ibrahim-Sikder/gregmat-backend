import authMiddleware from '@global/helpers/auth';
import { VocabCheckController } from '../controllers/vocabCheck.controller';
import { Router } from 'express';

class VocabCheckRoutes {
    private router: Router;

    constructor() {
        this.router = Router();
    }

    public routes(): Router {
        this.router.get(
            '/vocab-check',
            authMiddleware.verifyUser,
            VocabCheckController.prototype.list
        );
        this.router.post(
            '/vocab-check',
            authMiddleware.verifyUser,
            VocabCheckController.prototype.create
        );
        this.router.get(
            '/vocab-check/:id',
            authMiddleware.verifyUser,
            VocabCheckController.prototype.get
        );
        this.router.post(
            '/vocab-check/:id/attempts',
            authMiddleware.verifyUser,
            VocabCheckController.prototype.submitAttempt
        );

        return this.router;
    }
}

export const vocabCheckRoutes = new VocabCheckRoutes();
