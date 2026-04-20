import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import {
    mountainCategorySchema,
    updateMountainCategorySchema,
} from '@mountain/schemas/mountainCategory';
import mountainService from '@service/db/mountain.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class MountainCategoryController {
    @CatchAsync()
    @ZodValidation(mountainCategorySchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await mountainService.createMountainCategory(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Mountain category created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getByMountain(req: Request, res: Response): Promise<void> {
        const { mountainId } = req.params;
        const result = await mountainService.getCategoriesByMountain(mountainId, req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Mountain categories fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { categoryId } = req.params;
        const result = await mountainService.getMountainCategoryById(categoryId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Mountain category fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(updateMountainCategorySchema)
    public async update(req: Request, res: Response): Promise<void> {
        const { categoryId } = req.params;
        const result = await mountainService.updateMountainCategory(categoryId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Mountain category updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { categoryId } = req.params;
        await mountainService.deleteMountainCategory(categoryId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Mountain category deleted successfully',
            data: null,
        });
    }
}

export default MountainCategoryController;
