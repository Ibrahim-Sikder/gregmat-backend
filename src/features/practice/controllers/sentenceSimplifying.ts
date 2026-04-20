import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import {
    SentenceSimplifyingAttemptSchema,
    SentenceSimplifyingPracticeSchema,
} from '@practice/schemas/sentenceSimplifying';
import sentenceSimplifyingService from '@service/db/sentenceSimplifying.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class SentenceSimplifyingController {
    // ============ Sentence Simplifying Practice CRUD ============

    @CatchAsync()
    @ZodValidation(SentenceSimplifyingPracticeSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await sentenceSimplifyingService.createSentenceSimplifyingPractice(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Sentence simplifying practice created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser?.userId;
        const result = await sentenceSimplifyingService.getAllSentenceSimplifyingPractices({
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
            userId,
        });
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Sentence simplifying practices fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const userId = req.currentUser?.userId;
        const result = await sentenceSimplifyingService.getSentenceSimplifyingPracticeById(
            id,
            userId
        );
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Sentence simplifying practice fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(SentenceSimplifyingPracticeSchema.partial())
    public async update(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await sentenceSimplifyingService.updateSentenceSimplifyingPractice(
            id,
            req.body
        );
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Sentence simplifying practice updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        await sentenceSimplifyingService.deleteSentenceSimplifyingPractice(id);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Sentence simplifying practice deleted successfully',
            data: null,
        });
    }

    // ============ Attempt Handling ============

    @CatchAsync()
    @ZodValidation(SentenceSimplifyingAttemptSchema)
    public async submitAttempt(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser!.userId;
        const result = await sentenceSimplifyingService.submitAttempt({
            ...req.body,
            user: userId,
        });
        sendResponse(res, {
            statusCode: HTTP_STATUS.ACCEPTED,
            success: true,
            message: 'Attempt submitted successfully. Grading in progress...',
            data: result,
        });
    }

    @CatchAsync()
    public async getUserAttempts(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser!.userId;
        const practiceId = req.query.practiceId as string | undefined;
        const result = await sentenceSimplifyingService.getUserAttempts(userId, practiceId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'User attempts fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAttemptById(req: Request, res: Response): Promise<void> {
        const { attemptId } = req.params;
        const userId = req.currentUser!.userId;
        const result = await sentenceSimplifyingService.getAttemptById(attemptId, userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Attempt fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async reportSentenceAttempt(req: Request, res: Response): Promise<void> {
        const { attemptId, sentenceId } = req.params;
        await sentenceSimplifyingService.reportSentenceAttempt(attemptId, parseInt(sentenceId));
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Sentence attempt reported successfully',
            data: null,
        });
    }
}

export default SentenceSimplifyingController;
