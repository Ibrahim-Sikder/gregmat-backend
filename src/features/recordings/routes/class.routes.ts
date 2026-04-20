import adminMiddleware from '@global/helpers/admin';
import authMiddleware from '@global/helpers/auth';
import Class from '@recordings/controllers/class';
import { Router } from 'express';

class ClassRoutes {
    private router: Router;

    constructor() {
        this.router = Router();
    }

    public routes(): Router {
        this.router.get('/class/all', Class.prototype.getAll);
        this.router.get('/class/feed', Class.prototype.contentFeed);
        this.router.get('/class/:classId', Class.prototype.getById);
        this.router.get('/class/group/:groupId', Class.prototype.getByGroupId);
        this.router.get('/class/slug/:slug', Class.prototype.getBySlug);
        this.router.post(
            '/class/create',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            Class.prototype.create
        );
        this.router.put(
            '/class/:classId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            Class.prototype.update
        );
        this.router.delete(
            '/class/:classId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            Class.prototype.delete
        );
        return this.router;
    }
}

const classRoutes: ClassRoutes = new ClassRoutes();

export default classRoutes;
