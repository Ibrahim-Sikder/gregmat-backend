import authMiddleware from '@global/helpers/auth';
import FlashCardClassGroupController from '@flashCard/controllers/classGroup';
import { Router } from 'express';

class FlashCardClassGroupRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        this.router.post(
            '/create',
            authMiddleware.verifyUser,
            FlashCardClassGroupController.prototype.create
        );

        // Get all flashcard class groups with optional filtering
        this.router.get('/all', FlashCardClassGroupController.prototype.getAll);

        // Get a specific flashcard class group by ID or slug
        this.router.get('/:id', FlashCardClassGroupController.prototype.getById);

        // Get all classes in a specific flashcard class group
        this.router.get('/:id/classes', FlashCardClassGroupController.prototype.getClassesInGroup);

        // Update a flashcard class group
        this.router.put(
            '/:id',
            authMiddleware.verifyUser,
            FlashCardClassGroupController.prototype.update
        );

        // Delete a flashcard class group
        this.router.delete(
            '/:id',
            authMiddleware.verifyUser,
            FlashCardClassGroupController.prototype.delete
        );

        return this.router;
    }
}

const flashCardClassGroupRoutes = new FlashCardClassGroupRoutes();
export default flashCardClassGroupRoutes;
