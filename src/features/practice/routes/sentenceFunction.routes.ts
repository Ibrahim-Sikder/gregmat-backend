import authMiddleware from '@global/helpers/auth';
import { SentenceFunctionController } from '@practice/controllers/sentenceFunction.controller';
import { Router } from 'express';

class SentenceFunctionRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
    }

    public routes(): Router {
        this.router.get(
            '/sentence-functions',
            authMiddleware.verifyUser,
            SentenceFunctionController.prototype.getSentenceFunctions
        );

        this.router.get(
            '/sentence-functions/:id',
            authMiddleware.verifyUser,
            SentenceFunctionController.prototype.getSentenceFunction
        );

        this.router.post(
            '/sentence-functions/create',
            authMiddleware.verifyUser,
            SentenceFunctionController.prototype.createSentenceFunction
        );

        this.router.post(
            '/sentence-functions/attempt',
            authMiddleware.verifyUser,
            SentenceFunctionController.prototype.submitAttempt
        );

        this.router.delete(
            '/sentence-functions/reset',
            authMiddleware.verifyUser,
            SentenceFunctionController.prototype.resetProgress
        );

        return this.router;
    }
}

const sentenceFunctionRoutes = new SentenceFunctionRoutes();
export default sentenceFunctionRoutes;
