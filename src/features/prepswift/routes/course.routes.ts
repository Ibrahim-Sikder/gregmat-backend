import adminMiddleware from '@global/helpers/admin';
import authMiddleware from '@global/helpers/auth';
import PrepswiftCourseController from '@prepswift/controllers/course';
import { Router } from 'express';

class PrepswiftCourseRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        // Create a new prepswift course
        this.router.post(
            '/create',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            PrepswiftCourseController.prototype.create
        );

        // Get all prepswift courses with optional filtering
        this.router.get(
            '/all',
            authMiddleware.verifyUser,
            PrepswiftCourseController.prototype.getAll
        );

        // Get a specific prepswift course by ID or slug (with populated categories and contents)
        this.router.get(
            '/:id',
            authMiddleware.verifyUser,
            PrepswiftCourseController.prototype.getById
        );

        // Update a prepswift course
        this.router.put(
            '/:id',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            PrepswiftCourseController.prototype.update
        );

        // Delete a prepswift course (will also delete associated categories and contents)
        this.router.delete(
            '/:id',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            PrepswiftCourseController.prototype.delete
        );

        return this.router;
    }
}

const prepswiftCourseRoutes = new PrepswiftCourseRoutes();
export default prepswiftCourseRoutes;
