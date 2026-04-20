import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import { mountainSchema, updateMountainSchema } from '@mountain/schemas/mountain';
import mountainService from '@service/db/mountain.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class MountainController {
    @CatchAsync()
    @ZodValidation(mountainSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await mountainService.createMountain(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Mountain created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await mountainService.getAllMountains();
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'All mountains fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { mountainId } = req.params;
        const result = await mountainService.getMountainById(mountainId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Mountain fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(updateMountainSchema)
    public async update(req: Request, res: Response): Promise<void> {
        const { mountainId } = req.params;
        const result = await mountainService.updateMountain(mountainId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Mountain updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { mountainId } = req.params;
        await mountainService.deleteMountain(mountainId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Mountain deleted successfully',
            data: null,
        });
    }

    @CatchAsync()
    public async getMountainDetails(req: Request, res: Response): Promise<void> {
        const { slug } = req.params;
        const userId = (req as any).currentUser?.userId;
        const result = await mountainService.getMountainDetails(slug, userId, req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Mountain with categories fetched successfully',
            data: result,
        });
    }
}

export default MountainController;
