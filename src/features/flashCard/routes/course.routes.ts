import authMiddleware from '@global/helpers/auth';
import FlashCardCourseController from '@flashCard/controllers/course';
import { Router } from 'express';

class FlashCardCourseRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        // Create a new flashcard course
        this.router.post(
            '/create',
            authMiddleware.verifyUser,
            FlashCardCourseController.prototype.create
        );

        // Get all flashcard courses with optional filtering
        this.router.get('/all', FlashCardCourseController.prototype.getAll);

        // Get a specific flashcard course by ID or slug
        this.router.get('/:id', FlashCardCourseController.prototype.getById);

        // Get all course groups for a specific flashcard course
        this.router.get('/:id/course-groups', FlashCardCourseController.prototype.getCourseGroups);

        // Update a flashcard course
        this.router.put(
            '/:id',
            authMiddleware.verifyUser,
            FlashCardCourseController.prototype.update
        );

        // Delete a flashcard course
        this.router.delete(
            '/:id',
            authMiddleware.verifyUser,
            FlashCardCourseController.prototype.delete
        );

        return this.router;
    }
}

const flashCardCourseRoutes = new FlashCardCourseRoutes();
export default flashCardCourseRoutes;
