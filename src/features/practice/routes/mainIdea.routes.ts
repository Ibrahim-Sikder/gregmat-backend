import authMiddleware from '@global/helpers/auth';
import MainIdeaController from '@practice/controllers/mainIdea';
import { Router } from 'express';

class MainIdeaRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        // ============ Main Idea Practice CRUD ============
        // Create a new main idea practice (admin only - requires auth)
        this.router.post(
            '/main-idea/create',
            authMiddleware.verifyUser,
            MainIdeaController.prototype.create
        );

        // Get all main idea practices (public, but shows attempt status if authenticated)
        this.router.get(
            '/main-idea/all',
            authMiddleware.checkAuthentication,
            MainIdeaController.prototype.getAll
        );

        // Get a specific main idea practice by ID or slug
        this.router.get(
            '/main-idea/:id',
            authMiddleware.checkAuthentication,
            MainIdeaController.prototype.getById
        );

        // Update a main idea practice (admin only)
        this.router.put(
            '/main-idea/:id',
            authMiddleware.verifyUser,
            MainIdeaController.prototype.update
        );

        // Delete a main idea practice (admin only)
        this.router.delete(
            '/main-idea/:id',
            authMiddleware.verifyUser,
            MainIdeaController.prototype.delete
        );

        // ============ Attempt Handling ============
        // Submit an attempt for a main idea practice (requires auth)
        this.router.post(
            '/main-idea/attempt/submit',
            authMiddleware.verifyUser,
            MainIdeaController.prototype.submitAttempt
        );

        // Get all attempts for the current user (requires auth)
        this.router.get(
            '/main-idea/attempt/my-attempts',
            authMiddleware.verifyUser,
            MainIdeaController.prototype.getUserAttempts
        );

        // Get a specific attempt by ID (requires auth)
        this.router.get(
            '/main-idea/attempt/:attemptId',
            authMiddleware.verifyUser,
            MainIdeaController.prototype.getAttemptById
        );

        // Check grading status of an attempt (requires auth)
        this.router.get(
            '/main-idea/attempt/:attemptId/status',
            authMiddleware.verifyUser,
            MainIdeaController.prototype.getAttemptById
        );

        // Report a paragraph attempt as incorrect (requires auth)
        this.router.post(
            '/main-idea/attempt/:attemptId/report/:paragraphId',
            authMiddleware.verifyUser,
            MainIdeaController.prototype.reportParagraphAttempt
        );

        return this.router;
    }
}

const mainIdeaRoutes = new MainIdeaRoutes();

export default mainIdeaRoutes;
