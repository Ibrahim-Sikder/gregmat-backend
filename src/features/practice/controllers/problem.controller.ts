import type { Request, Response } from 'express';
import { problemService } from '@service/db/problem.service';
import { StatusCodes } from 'http-status-codes';
import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';

export class ProblemController {
    @CatchAsync()
    public async getProblems(req: Request, res: Response): Promise<void> {
        const {
            page = '1',
            limit = '50',
            super_category,
            difficulty,
            status,
            search, // Fix: use 'search' instead of 'query'
            type,
            tag, // Fix: use 'tag' (singular) instead of 'tags' (plural)
            category, // Maps to first_tlc field
            has_solution,
            bookmarked,
        } = req.query;

        const superCat = (super_category as string) || 'all';

        const result = await problemService.getProblems(req.currentUser!.userId, {
            page: Number(page),
            limit: Number(limit),
            superCategory: superCat,
            difficulty: difficulty as string,
            status: status as string,
            type: type as string,
            search: search as string,
            tag: tag as string, // Fix: pass tag instead of tags
            category: category as string, // Maps to first_tlc
            hasSolution: has_solution === 'true',
            bookmarked: bookmarked === 'true',
        });

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Problems fetched successfully',
            data: result.data,
            meta: result.meta,
        });
    }

    @CatchAsync()
    public async getProblem(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const userId = req.currentUser!.userId;

        const problem = await problemService.getProblemByIdWithUserData(userId, id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Problem fetched successfully',
            data: problem,
        });
    }

    @CatchAsync()
    public async createProblem(req: Request, res: Response): Promise<void> {
        const problem = await problemService.createProblem(req.body);

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: 'Problem created successfully',
            data: problem,
        });
    }

    @CatchAsync()
    public async updateProblem(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const problem = await problemService.updateProblem(id, req.body);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Problem updated successfully',
            data: problem,
        });
    }

    @CatchAsync()
    public async deleteProblem(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        await problemService.deleteProblem(id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Problem deleted successfully',
            data: null,
        });
    }

    @CatchAsync()
    public async submitAttempt(req: Request, res: Response): Promise<void> {
        const { problemId, isCorrect, answer } = req.body;
        const userId = req.currentUser!.userId;

        await problemService.addAttempt(userId, problemId, isCorrect, answer);

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: 'Attempt recorded successfully',
            data: null,
        });
    }

    @CatchAsync()
    public async resetAttempts(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const userId = req.currentUser!.userId;

        await problemService.resetAttempts(userId, id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Problem attempts reset successfully',
            data: null,
        });
    }

    @CatchAsync()
    public async toggleLike(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const userId = req.currentUser!.userId;

        const result = await problemService.toggleLike(userId, id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Like toggled successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async toggleDislike(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const userId = req.currentUser!.userId;

        const result = await problemService.toggleDislike(userId, id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Dislike toggled successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async toggleBookmark(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const userId = req.currentUser!.userId;

        const result = await problemService.toggleBookmark(userId, id);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Bookmark toggled successfully',
            data: result,
        });
    }
}
