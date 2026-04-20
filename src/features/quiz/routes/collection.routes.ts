import adminMiddleware from '@global/helpers/admin';
import authMiddleware from '@global/helpers/auth';
import CollectionController from '@quiz/controllers/collection';
import { Router } from 'express';

class CollectionRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        this.router.post(
            '/create',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            CollectionController.prototype.createCollection
        );

        this.router.get('/all', CollectionController.prototype.getAllCollections);

        this.router.get(
            '/:collectionSlug/:groupSlug',
            authMiddleware.verifyUser,
            CollectionController.prototype.getQuizGroupBySlug
        );

        this.router.get(
            '/:collectionId',
            authMiddleware.verifyUser,
            CollectionController.prototype.getCollectionById
        );

        this.router.put(
            '/:collectionId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            CollectionController.prototype.updateCollection
        );

        this.router.delete(
            '/:collectionId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            CollectionController.prototype.deleteCollection
        );

        this.router.post(
            '/:collectionId/groups',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            CollectionController.prototype.addGroupToCollection
        );

        this.router.put(
            '/:collectionId/groups/:groupSlug',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            CollectionController.prototype.updateGroupInCollection
        );

        this.router.delete(
            '/:collectionId/groups/:groupSlug',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            CollectionController.prototype.removeGroupFromCollection
        );

        this.router.post(
            '/:collectionId/groups/:groupSlug/quizzes',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            CollectionController.prototype.addQuizToGroup
        );

        this.router.delete(
            '/:collectionId/groups/:groupSlug/quizzes/:quizId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            CollectionController.prototype.removeQuizFromGroup
        );

        this.router.put(
            '/:collectionId/groups/:groupSlug/reorder',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            CollectionController.prototype.reorderQuizzes
        );

        return this.router;
    }
}

const quizCollectionRoutes = new CollectionRoutes();
export default quizCollectionRoutes;
