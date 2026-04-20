import { FlashCardClassGroupSchema } from '@flashCard/schemas/classGroup';
import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import flashCardClassGroupService from '@service/db/flashCardClassGroup.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class FlashCardClassGroupController {
    @CatchAsync()
    @ZodValidation(FlashCardClassGroupSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await flashCardClassGroupService.createFlashCardClassGroup(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'FlashCard class group created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await flashCardClassGroupService.getAllFlashCardClassGroups(req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard class groups fetched successfully',
            data: result?.data,
            meta: result?.meta,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await flashCardClassGroupService.getFlashCardClassGroupById(id);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard class group fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getClassesInGroup(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await flashCardClassGroupService.getClassesInClassGroup(id);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Classes in FlashCard class group fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(FlashCardClassGroupSchema.partial())
    public async update(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await flashCardClassGroupService.updateFlashCardClassGroup(id, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard class group updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { courseId } = req.body;
        const result = await flashCardClassGroupService.deleteFlashCardClassGroup(id, courseId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard class group deleted successfully',
            data: result,
        });
    }
}

export default FlashCardClassGroupController;
