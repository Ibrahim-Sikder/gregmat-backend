import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import { FlashCardClassSchema } from '@flashCard/schemas/class';
import flashCardClassService from '@service/db/flashCardClass.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class FlashCardClassController {
    @CatchAsync()
    @ZodValidation(FlashCardClassSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await flashCardClassService.createFlashCardClass(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'FlashCard class created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await flashCardClassService.getAllFlashCardClasses(req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard classes fetched successfully',
            data: result?.data,
            meta: result?.meta,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await flashCardClassService.getFlashCardClassById(id);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard class fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(FlashCardClassSchema.partial())
    public async update(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await flashCardClassService.updateFlashCardClass(id, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard class updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { classGroupId } = req.body;
        const result = await flashCardClassService.deleteFlashCardClass(id, classGroupId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard class deleted successfully',
            data: result,
        });
    }

    async createBulkFlashCardClasses(req: Request, res: Response): Promise<void> {
        const { classGroupId, data } = req.body;
        const result = await flashCardClassService.createBulkFlashCardClasses(data, classGroupId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Bulk FlashCard classes created successfully',
            data: result,
        });
    }
}

export default FlashCardClassController;
