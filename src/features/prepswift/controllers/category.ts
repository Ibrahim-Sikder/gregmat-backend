import { PrepswiftCategorySchema } from '@prepswift/schemas/category';
import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import prepswiftCategoryService from '@service/db/prepswiftCategory.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class PrepswiftCategoryController {
    @CatchAsync()
    @ZodValidation(PrepswiftCategorySchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await prepswiftCategoryService.create(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Category created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await prepswiftCategoryService.getAll(req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Categories fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getByCourseId(req: Request, res: Response): Promise<void> {
        const { courseId } = req.params;
        const result = await prepswiftCategoryService.getByCourseId(courseId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Categories fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await prepswiftCategoryService.getById(id);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Category fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getBySlug(req: Request, res: Response): Promise<void> {
        const { slug } = req.params;
        const result = await prepswiftCategoryService.getBySlug(slug);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Category fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(PrepswiftCategorySchema.partial())
    public async update(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await prepswiftCategoryService.update(id, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Category updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await prepswiftCategoryService.delete(id);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Category deleted successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(PrepswiftCategorySchema.array())
    public async bulkCreate(req: Request, res: Response): Promise<void> {
        const result = await prepswiftCategoryService.bulkCreate(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Categories created successfully',
            data: result,
        });
    }
}

export default PrepswiftCategoryController;
