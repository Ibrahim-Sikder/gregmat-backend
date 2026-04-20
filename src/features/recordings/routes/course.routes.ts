import adminMiddleware from '@global/helpers/admin';
import authMiddleware from '@global/helpers/auth';
import Course from '@recordings/controllers/course';
import { Router } from 'express';

class CourseRoutes {
    private router: Router;

    constructor() {
        this.router = Router();
    }

    public routes(): Router {
        this.router.get('/course/all', Course.prototype.getAll);
        this.router.get('/course/:courseId', Course.prototype.getById);
        this.router.get('/course/series/:seriesId', Course.prototype.getCoursesBySeriesId);
        this.router.get('/course/slug/:slug', Course.prototype.getCourseBySlug);
        this.router.post(
            '/course/create',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            Course.prototype.create
        );
        this.router.put(
            '/course/:courseId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            Course.prototype.update
        );
        this.router.delete(
            '/course/:courseId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            Course.prototype.delete
        );

        return this.router;
    }
}

const courseRoutes: CourseRoutes = new CourseRoutes();

export default courseRoutes;
