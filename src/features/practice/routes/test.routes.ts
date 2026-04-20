import authMiddleware from '@global/helpers/auth';
import TestController from '@practice/controllers/test';
import { Router } from 'express';

class TestRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        this.router.get('/summary', authMiddleware.verifyUser, TestController.prototype.getSummary);

        this.router.post(
            '/test/create',
            authMiddleware.verifyUser,
            TestController.prototype.create
        );

        this.router.get('/test/all', TestController.prototype.getAll);
        this.router.get('/test/:testId', TestController.prototype.getById);

        this.router.put(
            '/test/:testId',
            authMiddleware.verifyUser,
            TestController.prototype.update
        );

        this.router.delete(
            '/test/:testId',
            authMiddleware.verifyUser,
            TestController.prototype.delete
        );

        return this.router;
    }
}

const testRoutes = new TestRoutes();

export default testRoutes;
