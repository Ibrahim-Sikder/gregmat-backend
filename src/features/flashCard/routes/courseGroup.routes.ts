import FlashCardCourseGroupController from '@flashCard/controllers/courseGroup';
import authMiddleware from '@global/helpers/auth';
import { Router } from 'express';

class FlashCardCourseGroupRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        // Create a new flashcard course group
        this.router.post(
            '/create',
            authMiddleware.verifyUser,
            FlashCardCourseGroupController.prototype.create
        );

        // Get all flashcard course groups with optional filtering
        this.router.get('/all', FlashCardCourseGroupController.prototype.getAll);

        // Get a specific flashcard course group by ID or slug
        this.router.get('/:id', FlashCardCourseGroupController.prototype.getById);

        // Get all courses in a course group
        this.router.get('/:id/courses', FlashCardCourseGroupController.prototype.getCourses);

        // Update a flashcard course group
        this.router.put(
            '/:id',
            authMiddleware.verifyUser,
            FlashCardCourseGroupController.prototype.update
        );

        // Delete a flashcard course group
        this.router.delete(
            '/:id',
            authMiddleware.verifyUser,
            FlashCardCourseGroupController.prototype.delete
        );

        return this.router;
    }
}

const flashCardCourseGroupRoutes = new FlashCardCourseGroupRoutes();
export default flashCardCourseGroupRoutes;
