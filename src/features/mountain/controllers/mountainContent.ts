import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import {
    mountainContentSchema,
    updateMountainContentSchema,
    updateColorsSchema,
} from '@mountain/schemas/mountainContent';
import mountainService from '@service/db/mountain.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class MountainContentController {
    @CatchAsync()
    @ZodValidation(mountainContentSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await mountainService.createMountainContent(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Mountain content created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getByCategory(req: Request, res: Response): Promise<void> {
        const { categoryId } = req.params;
        const result = await mountainService.getContentByCategory(categoryId, req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Mountain content fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getByMountain(req: Request, res: Response): Promise<void> {
        const { mountainId } = req.params;
        const result = await mountainService.getContentByMountain(mountainId, req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Mountain content fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { contentId } = req.params;
        const result = await mountainService.getMountainContentById(contentId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Mountain content fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(updateMountainContentSchema)
    public async update(req: Request, res: Response): Promise<void> {
        const { contentId } = req.params;
        const result = await mountainService.updateMountainContent(contentId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Mountain content updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { contentId } = req.params;
        await mountainService.deleteMountainContent(contentId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Mountain content deleted successfully',
            data: null,
        });
    }

    @CatchAsync()
    @ZodValidation(updateColorsSchema)
    public async updateColors(req: Request, res: Response): Promise<void> {
        const { contentId } = req.params;
        const userId = (req as any).currentUser?.userId; // From auth middleware
        const { color } = req.body;

        if (!userId) {
            return sendResponse(res, {
                statusCode: HTTP_STATUS.UNAUTHORIZED,
                success: false,
                message: 'User authentication required',
                data: null,
            });
        }

        const result = await mountainService.updateUserContentColors(userId, contentId, color);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Colors updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    async resetUserContentColors(req: Request, res: Response): Promise<void> {
        const { contentId } = req.params;
        const userId = (req as any).currentUser?.userId; // From auth middleware

        const result = await mountainService.resetUserContentColors(userId, contentId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Colors reset successfully',
            data: result,
        });
    }

    @CatchAsync()
    async resetUserAllColorsInMountain(req: Request, res: Response): Promise<void> {
        const { mountainId } = req.params;
        const userId = (req as any).currentUser?.userId; // From auth middleware

        const result = await mountainService.resetUserAllColorsInMountain(userId, mountainId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'All colors in mountain reset successfully',
            data: result,
        });
    }

    @CatchAsync()
    async resetUsersColorsByCategory(req: Request, res: Response): Promise<void> {
        const { categoryId } = req.params;
        const userId = (req as any).currentUser?.userId; // From auth middleware

        const result = await mountainService.resetUsersColorsByCategory(userId, categoryId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Colors in category reset successfully',
            data: result,
        });
    }
}

export default MountainContentController;
