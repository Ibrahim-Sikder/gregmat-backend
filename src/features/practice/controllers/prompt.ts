import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import { PromptSchema } from '@practice/schemas/prompt';
import promptService from '@service/db/prompt.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class PromptController {
    @CatchAsync()
    @ZodValidation(PromptSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;
        const result = await promptService.createPrompt(currentUser!.userId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Prompt created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await promptService.getAllPrompts(req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'All prompts fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getUserPrompts(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;
        const result = await promptService.getUserPrompts(currentUser!.userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'User prompts fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { promptId } = req.params;
        const result = await promptService.getPromptById(promptId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Prompt fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(PromptSchema.partial())
    public async update(req: Request, res: Response): Promise<void> {
        const { promptId } = req.params;
        const result = await promptService.updatePrompt(promptId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Prompt updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { promptId } = req.params;
        const result = await promptService.deletePrompt(promptId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Prompt deleted successfully',
            data: result,
        });
    }
}

export default PromptController;
