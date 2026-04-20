import adminMiddleware from '@global/helpers/admin';
import authMiddleware from '@global/helpers/auth';
import PrepswiftCategoryController from '@prepswift/controllers/category';
import { Router } from 'express';

class PrepswiftCategoryRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        // Create a new category
        this.router.post(
            '/create',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            PrepswiftCategoryController.prototype.create
        );

        // Bulk create categories
        this.router.post(
            '/bulk',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            PrepswiftCategoryController.prototype.bulkCreate
        );

        // Get all categories
        this.router.get(
            '/all',
            authMiddleware.verifyUser,
            PrepswiftCategoryController.prototype.getAll
        );

        // Get categories by course ID
        this.router.get(
            '/course/:courseId',
            authMiddleware.verifyUser,
            PrepswiftCategoryController.prototype.getByCourseId
        );

        // Get category by slug
        this.router.get(
            '/slug/:slug',
            authMiddleware.verifyUser,
            PrepswiftCategoryController.prototype.getBySlug
        );

        // Get category by ID
        this.router.get(
            '/:id',
            authMiddleware.verifyUser,
            PrepswiftCategoryController.prototype.getById
        );

        // Update a category
        this.router.put(
            '/:id',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            PrepswiftCategoryController.prototype.update
        );

        // Delete a category
        this.router.delete(
            '/:id',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            PrepswiftCategoryController.prototype.delete
        );

        return this.router;
    }
}

const prepswiftCategoryRoutes = new PrepswiftCategoryRoutes();
export default prepswiftCategoryRoutes;
