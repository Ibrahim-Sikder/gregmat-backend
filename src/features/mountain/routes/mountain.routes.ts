import mountainController from '@mountain/controllers/mountain';
import mountainCategoryController from '@mountain/controllers/mountainCategory';
import mountainContentController from '@mountain/controllers/mountainContent';
import authMiddleware from '@global/helpers/auth';
import { Router } from 'express';
import adminMiddleware from '@global/helpers/admin';

class MountainRoutes {
    private router: Router;

    constructor() {
        this.router = Router();
    }

    public routes(): Router {
        // Mountain routes
        this.router.post(
            '/create',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            mountainController.prototype.create
        );
        this.router.get('/all', mountainController.prototype.getAll);
        this.router.get('/:mountainId', mountainController.prototype.getById);
        this.router.get(
            '/:slug/details',
            authMiddleware.verifyUser,
            mountainController.prototype.getMountainDetails
        );
        this.router.put(
            '/:mountainId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            mountainController.prototype.update
        );
        this.router.delete(
            '/:mountainId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            mountainController.prototype.delete
        );

        // Mountain Category routes
        this.router.post(
            '/categories/create',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            mountainCategoryController.prototype.create
        );
        this.router.get(
            '/:mountainId/categories/all',
            mountainCategoryController.prototype.getByMountain
        );
        this.router.get('/categories/:categoryId', mountainCategoryController.prototype.getById);
        this.router.put(
            '/categories/:categoryId',
            authMiddleware.verifyUser,
            mountainCategoryController.prototype.update
        );
        this.router.delete(
            '/categories/:categoryId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            mountainCategoryController.prototype.delete
        );

        // Mountain Content routes
        this.router.post(
            '/content/create',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            mountainContentController.prototype.create
        );
        this.router.get(
            '/categories/:categoryId/content/all',
            mountainContentController.prototype.getByCategory
        );
        this.router.get('/:mountainId/content', mountainContentController.prototype.getByMountain);
        this.router.get('/content/:contentId', mountainContentController.prototype.getById);
        this.router.put(
            '/content/:contentId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            mountainContentController.prototype.update
        );
        this.router.delete(
            '/content/:contentId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            mountainContentController.prototype.delete
        );

        // User Progress routes (authenticated)

        this.router.post(
            '/content/:contentId/colors',
            authMiddleware.verifyUser,
            mountainContentController.prototype.updateColors
        );

        // resetUserContentColors route
        this.router.post(
            '/content/:contentId/colors/reset',
            authMiddleware.verifyUser,
            mountainContentController.prototype.resetUserContentColors
        );

        // resetUserAllColorsInMountain
        this.router.post(
            '/:mountainId/colors/reset',
            authMiddleware.verifyUser,
            mountainContentController.prototype.resetUserAllColorsInMountain
        );

        // resetUsersColorsByCategory
        this.router.post(
            '/categories/:categoryId/colors/reset',
            authMiddleware.verifyUser,
            mountainContentController.prototype.resetUsersColorsByCategory
        );

        return this.router;
    }
}

const mountainRoutes: MountainRoutes = new MountainRoutes();
export default mountainRoutes;
