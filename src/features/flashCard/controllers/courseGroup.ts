import { FlashCardCourseGroupSchema } from '@flashCard/schemas/courseGroup';
import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import flashCardCourseGroupService from '@service/db/flashCardCourseGroup.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class FlashCardCourseGroupController {
    @CatchAsync()
    @ZodValidation(FlashCardCourseGroupSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await flashCardCourseGroupService.create(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'FlashCard course group created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await flashCardCourseGroupService.getAll(req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard course groups fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await flashCardCourseGroupService.getByIdOrSlug(id);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard course group fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(FlashCardCourseGroupSchema.partial())
    public async update(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await flashCardCourseGroupService.update(id, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard course group updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await flashCardCourseGroupService.delete(id);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard course group deleted successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getCourses(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const result = await flashCardCourseGroupService.getCourses(id);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'FlashCard courses fetched successfully',
            data: result,
        });
    }
}

export default FlashCardCourseGroupController;
