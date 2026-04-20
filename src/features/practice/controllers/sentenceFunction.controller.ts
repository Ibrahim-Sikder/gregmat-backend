import type { Request, Response } from 'express';
import { sentenceFunctionService } from '@service/db/sentenceFunction.service';
import { StatusCodes } from 'http-status-codes';
import { CatchAsync } from '@global/decorators/catch-async';
import sendResponse from '@global/helpers/sendResponse';

export class SentenceFunctionController {
    @CatchAsync()
    public async getSentenceFunctions(req: Request, res: Response): Promise<void> {
        const { page = '1', limit = '50', search, sort } = req.query;
        const result = await sentenceFunctionService.getSentenceFunctions(req.currentUser!.userId, {
            page: Number(page),
            limit: Number(limit),
            search: search as string,
            sort: sort as string,
        });

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Sentence functions fetched successfully',
            data: result.data,
            meta: result.meta,
        });
    }

    @CatchAsync()
    public async getSentenceFunction(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const sentenceFunction = await sentenceFunctionService.getSentenceFunctionById(
            req.currentUser!.userId,
            id
        );

        if (!sentenceFunction) {
            sendResponse(res, {
                statusCode: StatusCodes.NOT_FOUND,
                success: false,
                message: 'Sentence function not found',
                data: null,
            });
            return;
        }

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Sentence function fetched successfully',
            data: sentenceFunction,
        });
    }

    @CatchAsync()
    public async createSentenceFunction(req: Request, res: Response): Promise<void> {
        const sentenceFunction = await sentenceFunctionService.createSentenceFunction(req.body);

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: 'Sentence function created successfully',
            data: sentenceFunction,
        });
    }

    @CatchAsync()
    public async submitAttempt(req: Request, res: Response): Promise<void> {
        const { sentenceFunctionId, selected_sentence_part, correct } = req.body;
        const result = await sentenceFunctionService.submitAttempt(
            req.currentUser!.userId,
            sentenceFunctionId,
            {
                selected_sentence_part,
                correct,
            }
        );

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: 'Attempt submitted successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async resetProgress(req: Request, res: Response): Promise<void> {
        await sentenceFunctionService.resetProgress(req.currentUser!.userId);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Progress reset successfully',
            data: null,
        });
    }
}
