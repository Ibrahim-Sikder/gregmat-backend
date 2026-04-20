import { CatchAsync } from '@global/decorators/catch-async';
import sendResponse from '@global/helpers/sendResponse';
import { vocabCheckService } from '../services/vocabCheck.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class VocabCheckController {
    @CatchAsync()
    public async list(req: Request, res: Response): Promise<void> {
        const result = await vocabCheckService.listVocabChecks(req.currentUser!.userId, req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Vocab checks fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async create(req: Request, res: Response): Promise<void> {
        const result = await vocabCheckService.createVocabCheck(req.currentUser!.userId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Vocab check created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async get(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await vocabCheckService.getVocabCheck(req.currentUser!.userId, id);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Vocab check fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async submitAttempt(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await vocabCheckService.submitAttempt(req.currentUser!.userId, id, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Attempt submitted successfully',
            data: result,
        });
    }
}
