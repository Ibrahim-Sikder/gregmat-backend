import authMiddleware from '@global/helpers/auth';
import PromptController from '@practice/controllers/prompt';
import { Router } from 'express';

class PromptRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        this.router.post(
            '/prompt/create',
            authMiddleware.verifyUser,
            PromptController.prototype.create
        );

        this.router.get('/prompt/all', PromptController.prototype.getAll);
        this.router.get(
            '/prompt/user',
            authMiddleware.verifyUser,
            PromptController.prototype.getUserPrompts
        );

        this.router.get('/prompt/:promptId', PromptController.prototype.getById);

        this.router.put(
            '/prompt/:promptId',
            authMiddleware.verifyUser,
            PromptController.prototype.update
        );

        this.router.delete(
            '/prompt/:promptId',
            authMiddleware.verifyUser,
            PromptController.prototype.delete
        );

        return this.router;
    }
}

const promptRoutes = new PromptRoutes();

export default promptRoutes;
