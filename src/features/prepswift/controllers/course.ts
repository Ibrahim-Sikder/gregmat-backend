import { PrepswiftCourseSchema } from '@prepswift/schemas/course';
import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import prepswiftCourseService from '@service/db/prepswiftCourse.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class PrepswiftCourseController {
    @CatchAsync()
    @ZodValidation(PrepswiftCourseSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await prepswiftCourseService.create(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Prepswift course created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await prepswiftCourseService.getAll(req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Prepswift courses fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const userId = req.currentUser?.userId;
        const result = await prepswiftCourseService.getByIdOrSlug(id, userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Prepswift course fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(PrepswiftCourseSchema.partial())
    public async update(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await prepswiftCourseService.update(id, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Prepswift course updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await prepswiftCourseService.delete(id);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Prepswift course deleted successfully',
            data: result,
        });
    }
}

export default PrepswiftCourseController;
