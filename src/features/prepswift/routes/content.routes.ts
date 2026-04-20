import adminMiddleware from '@global/helpers/admin';
import authMiddleware from '@global/helpers/auth';
import PrepswiftContentController from '@prepswift/controllers/content';
import { Router } from 'express';

class PrepswiftContentRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        // Create a new content
        this.router.post(
            '/create',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            PrepswiftContentController.prototype.create
        );

        // Bulk create contents
        this.router.post(
            '/bulk',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            PrepswiftContentController.prototype.bulkCreate
        );

        // Get all contents with pagination and search
        this.router.get(
            '/all',
            authMiddleware.verifyUser,
            PrepswiftContentController.prototype.getAll
        );

        // Get contents by category ID
        this.router.get(
            '/category/:categoryId',
            authMiddleware.verifyUser,
            PrepswiftContentController.prototype.getByCategoryId
        );

        // Get contents by course ID
        this.router.get(
            '/course/:courseId',
            authMiddleware.verifyUser,
            PrepswiftContentController.prototype.getByCourseId
        );

        // Get content by slug
        this.router.get(
            '/slug/:slug',
            authMiddleware.verifyUser,
            PrepswiftContentController.prototype.getBySlug
        );

        // Get content with navigation (prev/next)
        this.router.get(
            '/navigation/:id',
            authMiddleware.verifyUser,
            PrepswiftContentController.prototype.getContentWithNavigation
        );

        // Get content by ID
        this.router.get(
            '/:id',
            authMiddleware.verifyUser,
            PrepswiftContentController.prototype.getById
        );

        // Update a content
        this.router.put(
            '/:id',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            PrepswiftContentController.prototype.update
        );

        // Delete a content
        this.router.delete(
            '/:id',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            PrepswiftContentController.prototype.delete
        );

        return this.router;
    }
}

const prepswiftContentRoutes = new PrepswiftContentRoutes();
export default prepswiftContentRoutes;
