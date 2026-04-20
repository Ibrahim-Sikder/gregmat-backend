import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import { WriteEssaySchema } from '@practice/schemas/writeEssay';
import essayService from '@service/db/essay.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class EssayController {
    @CatchAsync()
    @ZodValidation(WriteEssaySchema)
    public async submit(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;
        const payload = req.body;

        const result = await essayService.createEssay({ ...payload, userId: currentUser!.userId });

        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Essay submitted and feedback generated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { essayId } = req.params;
        const result = await essayService.getEssayById(essayId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Essay fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getByUser(req: Request, res: Response): Promise<void> {
        const { userId } = req.params;
        const result = await essayService.getEssaysByUser(userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'User essays fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getMyEssays(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;
        const userId = currentUser?.userId;
        const result = await essayService.getEssaysByUser(userId!);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Your essays fetched successfully',
            data: result,
        });
    }
}

export default EssayController;
