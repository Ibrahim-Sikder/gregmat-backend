import authMiddleware from '@global/helpers/auth';
import FlashCardClassController from '@flashCard/controllers/class';
import { Router } from 'express';

class FlashCardClassRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        // Create bulk flashcard classes
        this.router.post(
            '/bulk-create',
            authMiddleware.verifyUser,
            FlashCardClassController.prototype.createBulkFlashCardClasses
        );

        // Create a new flashcard class
        this.router.post(
            '/create',
            authMiddleware.verifyUser,
            FlashCardClassController.prototype.create
        );

        // Get all flashcard classes with optional filtering
        this.router.get('/all', FlashCardClassController.prototype.getAll);

        // Get a specific flashcard class by ID or slug
        this.router.get('/:id', FlashCardClassController.prototype.getById);

        // Update a flashcard class
        this.router.put(
            '/:id',
            authMiddleware.verifyUser,
            FlashCardClassController.prototype.update
        );

        // Delete a flashcard class
        this.router.delete(
            '/:id',
            authMiddleware.verifyUser,
            FlashCardClassController.prototype.delete
        );

        return this.router;
    }
}

const flashCardClassRoutes = new FlashCardClassRoutes();
export default flashCardClassRoutes;
