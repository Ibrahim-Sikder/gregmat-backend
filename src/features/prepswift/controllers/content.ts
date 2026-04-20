import { PrepswiftContentSchema } from '@prepswift/schemas/content';
import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import prepswiftContentService from '@service/db/prepswiftContent.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { z } from 'zod';

class PrepswiftContentController {
    @CatchAsync()
    @ZodValidation(PrepswiftContentSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await prepswiftContentService.create(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Content created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        const search = (req.query.search as string) || '';
        const query = { ...req.query };
        delete query.page;
        delete query.limit;
        delete query.search;

        const result = await prepswiftContentService.getAll(query, page, limit, search);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Contents fetched successfully',
            data: result.data,
            meta: result.meta,
        });
    }

    @CatchAsync()
    public async getByCategoryId(req: Request, res: Response): Promise<void> {
        const { categoryId } = req.params;
        const userId = req.currentUser?.userId;
        const result = await prepswiftContentService.getByCategoryId(categoryId, userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Contents fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getByCourseId(req: Request, res: Response): Promise<void> {
        const { courseId } = req.params;
        const userId = req.currentUser?.userId;
        const result = await prepswiftContentService.getByCourseId(courseId, userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Contents fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const userId = req.currentUser?.userId;
        const result = await prepswiftContentService.getById(id, userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Content fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getBySlug(req: Request, res: Response): Promise<void> {
        const { slug } = req.params;
        const userId = req.currentUser?.userId;
        const result = await prepswiftContentService.getBySlug(slug, userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Content fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getContentWithNavigation(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const userId = req.currentUser?.userId;
        const result = await prepswiftContentService.getContentWithNavigation(id, userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Content with navigation fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(PrepswiftContentSchema.partial())
    public async update(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await prepswiftContentService.update(id, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Content updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await prepswiftContentService.delete(id);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Content deleted successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(PrepswiftContentSchema.array())
    public async bulkCreate(req: Request, res: Response): Promise<void> {
        const result = await prepswiftContentService.bulkCreate(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Contents created successfully',
            data: result,
        });
    }
}

export default PrepswiftContentController;
