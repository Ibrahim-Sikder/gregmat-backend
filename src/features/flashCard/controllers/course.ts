import { FlashCardCourseSchema } from '@flashCard/schemas/course';
import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import flashCardCourseService from '@service/db/flashCardCourse.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class FlashCardCourseController {
    @CatchAsync()
    @ZodValidation(FlashCardCourseSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await flashCardCourseService.create(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'FlashCard course created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await flashCardCourseService.getAll(req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard courses fetched successfully',
            data: result?.data,
            meta: result?.meta,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await flashCardCourseService.getByIdOrSlug(id);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard course fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(FlashCardCourseSchema.partial())
    public async update(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await flashCardCourseService.update(id, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard course updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const { courseGroupId } = req.body;
        const result = await flashCardCourseService.delete(id, courseGroupId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard course deleted successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getCourseGroups(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await flashCardCourseService.getCourseGroups(id);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard course groups fetched successfully',
            data: result,
        });
    }
}

export default FlashCardCourseController;
