import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import { AttemptSchema } from '@quiz/schemas/attempt';
import attemptService from '@service/db/attempt.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class AttemptController {
    @CatchAsync()
    @ZodValidation(AttemptSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await attemptService.createAttempt(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Attempt created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await attemptService.getAllAttempts(req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'All attempts fetched successfully',
            data: result?.data,
            meta: result?.meta,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { attemptId } = req.params;
        const result = await attemptService.getAttemptById(attemptId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Attempt fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getByUserId(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;
        const result = await attemptService.getAttemptsByUserId(userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'User attempts fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(AttemptSchema.partial())
    public async update(req: Request, res: Response): Promise<void> {
        const { attemptId } = req.params;
        const result = await attemptService.updateAttempt(attemptId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Attempt updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { attemptId } = req.params;
        const result = await attemptService.deleteAttempt(attemptId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Attempt deleted successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getByQuestionId(req: Request, res: Response): Promise<void> {
        const { questionId } = req.params;
        const result = await attemptService.getAttemptsByQuestionId(questionId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Question attempts fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getUserStats(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;
        const result = await attemptService.getUserAttemptStats(userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'User attempt statistics fetched successfully',
            data: result,
        });
    }
}

export default AttemptController;
