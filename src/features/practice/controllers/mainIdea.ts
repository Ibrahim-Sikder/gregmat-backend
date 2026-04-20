import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import { MainIdeaAttemptSchema, MainIdeaPracticeSchema } from '@practice/schemas/mainIdea';
import mainIdeaService from '@service/db/mainIdea.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class MainIdeaController {
    // ============ Main Idea Practice CRUD ============

    @CatchAsync()
    @ZodValidation(MainIdeaPracticeSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await mainIdeaService.createMainIdeaPractice(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Main idea practice created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser?.userId;
        const result = await mainIdeaService.getAllMainIdeaPractices({
            page: req.query.page ? parseInt(req.query.page as string) : 1,
            limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
            userId,
        });
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Main idea practices fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const userId = req.currentUser?.userId;
        const result = await mainIdeaService.getMainIdeaPracticeById(id, userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Main idea practice fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(MainIdeaPracticeSchema.partial())
    public async update(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await mainIdeaService.updateMainIdeaPractice(id, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Main idea practice updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        await mainIdeaService.deleteMainIdeaPractice(id);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Main idea practice deleted successfully',
            data: null,
        });
    }

    // ============ Attempt Handling ============

    @CatchAsync()
    @ZodValidation(MainIdeaAttemptSchema)
    public async submitAttempt(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser!.userId;
        const result = await mainIdeaService.submitAttempt({
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
        const result = await mainIdeaService.getUserAttempts(userId, practiceId);
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
        const result = await mainIdeaService.getAttemptById(attemptId, userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Attempt fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async reportParagraphAttempt(req: Request, res: Response): Promise<void> {
        const { attemptId, paragraphId } = req.params;
        await mainIdeaService.reportParagraphAttempt(attemptId, paragraphId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Paragraph attempt reported successfully',
            data: null,
        });
    }
}

export default MainIdeaController;
