import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import classService from '@service/db/class.service';
import { classSchema } from '@recordings/schemas/class';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class Class {
    @CatchAsync()
    @ZodValidation(classSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await classService.createClass(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Class created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await classService.getAllClasses();
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'All classes fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { classId } = req.params;
        const result = await classService.getClassById(classId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Class fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getBySlug(req: Request, res: Response): Promise<void> {
        const { slug } = req.params;
        const result = await classService.getClassBySlug(slug);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Class fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(classSchema)
    public async update(req: Request, res: Response): Promise<void> {
        const { classId } = req.params;
        const result = await classService.updateClass(classId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Class updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { classId } = req.params;
        const result = await classService.deleteClass(classId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Class deleted successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getByGroupId(req: Request, res: Response): Promise<void> {
        const { groupId } = req.params;
        const result = await classService.getClassesByGroupId(groupId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Classes fetched successfully',
            data: result,
        });
    }

    public async contentFeed(req: Request, res: Response): Promise<void> {
        const result = await classService.contentFeed(req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Class feed fetched successfully',
            data: result.result,
            meta: result.meta,
        });
    }
}

export default Class;
