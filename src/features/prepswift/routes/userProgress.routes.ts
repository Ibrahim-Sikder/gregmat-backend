import authMiddleware from '@global/helpers/auth';
import UserProgressController from '@prepswift/controllers/userProgress';
import { Router } from 'express';

class UserProgressRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        // Mark content as saved
        this.router.post(
            '/mark-saved',
            authMiddleware.verifyUser,
            UserProgressController.prototype.markAsSaved
        );

        // Mark content as watched
        this.router.post(
            '/mark-watched',
            authMiddleware.verifyUser,
            UserProgressController.prototype.markAsWatched
        );

        // Update watch progress (for video progress tracking)
        this.router.post(
            '/update-progress',
            authMiddleware.verifyUser,
            UserProgressController.prototype.updateWatchProgress
        );

        // Remove content from saved
        this.router.post(
            '/remove-saved',
            authMiddleware.verifyUser,
            UserProgressController.prototype.removeSaved
        );

        // Get user progress for a specific course
        this.router.get(
            '/course/:courseId',
            authMiddleware.verifyUser,
            UserProgressController.prototype.getUserProgress
        );

        // Get all saved contents (optionally filtered by course)
        this.router.get(
            '/saved',
            authMiddleware.verifyUser,
            UserProgressController.prototype.getSavedContents
        );

        // Get all watched contents (optionally filtered by course)
        this.router.get(
            '/watched',
            authMiddleware.verifyUser,
            UserProgressController.prototype.getWatchedContents
        );

        return this.router;
    }
}

const userProgressRoutes = new UserProgressRoutes();
export default userProgressRoutes;
