import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import { TestSchema } from '@practice/schemas/test';
import practiceService from '@service/db/practice.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class TestController {
    @CatchAsync()
    @ZodValidation(TestSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await practiceService.createTest(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Test created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await practiceService.getAllTests(req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'All tests fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { testId } = req.params;
        const result = await practiceService.getTestById(testId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Test fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(TestSchema.partial())
    public async update(req: Request, res: Response): Promise<void> {
        const { testId } = req.params;
        const result = await practiceService.updateTest(testId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Test updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { testId } = req.params;
        const result = await practiceService.deleteTest(testId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Test deleted successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getSummary(req: Request, res: Response): Promise<void> {
        const result = await practiceService.getPracticeSummary(req.currentUser!.userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Practice summary fetched successfully',
            data: result,
        });
    }
}

export default TestController;
