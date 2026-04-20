import authMiddleware from '@global/helpers/auth';
import SentenceSimplifyingController from '@practice/controllers/sentenceSimplifying';
import { Router } from 'express';

class SentenceSimplifyingRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        // ============ Sentence Simplifying Practice CRUD ============
        // Create a new sentence simplifying practice (admin only - requires auth)
        this.router.post(
            '/sentence-simplifying/create',
            authMiddleware.verifyUser,
            SentenceSimplifyingController.prototype.create
        );

        // Get all sentence simplifying practices (public, but shows attempt status if authenticated)
        this.router.get(
            '/sentence-simplifying/all',
            authMiddleware.checkAuthentication,
            SentenceSimplifyingController.prototype.getAll
        );

        // Get a specific sentence simplifying practice by ID or slug
        this.router.get(
            '/sentence-simplifying/:id',
            authMiddleware.checkAuthentication,
            SentenceSimplifyingController.prototype.getById
        );

        // Update a sentence simplifying practice (admin only)
        this.router.put(
            '/sentence-simplifying/:id',
            authMiddleware.verifyUser,
            SentenceSimplifyingController.prototype.update
        );

        // Delete a sentence simplifying practice (admin only)
        this.router.delete(
            '/sentence-simplifying/:id',
            authMiddleware.verifyUser,
            SentenceSimplifyingController.prototype.delete
        );

        // ============ Attempt Handling ============
        // Submit an attempt for a sentence simplifying practice (requires auth)
        this.router.post(
            '/sentence-simplifying/attempt/submit',
            authMiddleware.verifyUser,
            SentenceSimplifyingController.prototype.submitAttempt
        );

        // Get all attempts for the current user (requires auth)
        this.router.get(
            '/sentence-simplifying/attempt/my-attempts',
            authMiddleware.verifyUser,
            SentenceSimplifyingController.prototype.getUserAttempts
        );

        // Get a specific attempt by ID (requires auth)
        this.router.get(
            '/sentence-simplifying/attempt/:attemptId',
            authMiddleware.verifyUser,
            SentenceSimplifyingController.prototype.getAttemptById
        );

        // Check grading status of an attempt (requires auth)
        this.router.get(
            '/sentence-simplifying/attempt/:attemptId/status',
            authMiddleware.verifyUser,
            SentenceSimplifyingController.prototype.getAttemptById
        );

        // Report a sentence attempt as incorrect (requires auth)
        this.router.post(
            '/sentence-simplifying/attempt/:attemptId/report/:sentenceId',
            authMiddleware.verifyUser,
            SentenceSimplifyingController.prototype.reportSentenceAttempt
        );

        return this.router;
    }
}

const sentenceSimplifyingRoutes = new SentenceSimplifyingRoutes();

export default sentenceSimplifyingRoutes;
