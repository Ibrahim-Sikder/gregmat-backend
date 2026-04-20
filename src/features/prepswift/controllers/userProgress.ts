import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import userProgressService from '@service/db/userProgress.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { z } from 'zod';

const ProgressUpdateSchema = z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    categoryId: z.string().min(1, 'Category ID is required'),
    contentId: z.string().min(1, 'Content ID is required'),
});

const WatchProgressSchema = z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    categoryId: z.string().min(1, 'Category ID is required'),
    contentId: z.string().min(1, 'Content ID is required'),
    watchProgress: z.number().min(0).max(100).optional().default(100),
    lastWatchedPosition: z.number().min(0).optional().default(0),
});

class UserProgressController {
    @CatchAsync()
    @ZodValidation(ProgressUpdateSchema)
    public async markAsSaved(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser?.userId;
        const { courseId, categoryId, contentId } = req.body;

        const result = await userProgressService.markAsSaved(
            userId,
            courseId,
            categoryId,
            contentId
        );
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Content marked as saved successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(WatchProgressSchema)
    public async markAsWatched(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser?.userId;
        const { courseId, categoryId, contentId, watchProgress, lastWatchedPosition } = req.body;

        const result = await userProgressService.markAsWatched(
            userId,
            courseId,
            categoryId,
            contentId,
            watchProgress,
            lastWatchedPosition
        );
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Content marked as watched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(WatchProgressSchema)
    public async updateWatchProgress(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser?.userId;
        const { courseId, categoryId, contentId, watchProgress, lastWatchedPosition } = req.body;

        const result = await userProgressService.updateWatchProgress(
            userId,
            courseId,
            categoryId,
            contentId,
            watchProgress || 0,
            lastWatchedPosition || 0
        );
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Watch progress updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(ProgressUpdateSchema)
    public async removeSaved(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser?.userId;
        const { courseId, categoryId, contentId } = req.body;

        const result = await userProgressService.removeSaved(
            userId,
            courseId,
            categoryId,
            contentId
        );
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Content removed from saved successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getUserProgress(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser?.userId || '';
        const { courseId } = req.params;

        const result = await userProgressService.getUserProgress(userId, courseId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'User progress fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getSavedContents(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser?.userId || '';
        const { courseId } = req.query;

        const result = await userProgressService.getSavedContents(userId, courseId as string);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Saved contents fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getWatchedContents(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser?.userId || '';
        const { courseId } = req.query;

        const result = await userProgressService.getWatchedContents(userId, courseId as string);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Watched contents fetched successfully',
            data: result,
        });
    }
}

export default UserProgressController;
