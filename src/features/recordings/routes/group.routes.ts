import adminMiddleware from '@global/helpers/admin';
import authMiddleware from '@global/helpers/auth';
import Group from '@recordings/controllers/group';
import { Router } from 'express';

class GroupRoutes {
    private router: Router;

    constructor() {
        this.router = Router();
    }

    public routes(): Router {
        this.router.get('/group/all', Group.prototype.getAll);
        this.router.get('/group/:groupId', Group.prototype.getById);
        this.router.get('/group/course/:courseId', Group.prototype.getByCourseId);
        this.router.post(
            '/group/create',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            Group.prototype.create
        );
        this.router.put(
            '/group/:groupId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            Group.prototype.update
        );
        this.router.delete(
            '/group/:groupId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            Group.prototype.delete
        );
        return this.router;
    }
}

const groupRoutes: GroupRoutes = new GroupRoutes();

export default groupRoutes;
