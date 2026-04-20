import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import groupService from '@service/db/group.service';
import { classGroupSchema } from '@recordings/schemas/group';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class Group {
    @CatchAsync()
    @ZodValidation(classGroupSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await groupService.createGroup(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Group created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await groupService.getAllGroups();
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'All groups fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { groupId } = req.params;
        const result = await groupService.getGroupById(groupId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Group fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(classGroupSchema)
    public async update(req: Request, res: Response): Promise<void> {
        const { groupId } = req.params;
        const result = await groupService.updateGroup(groupId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Group updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { groupId } = req.params;
        const result = await groupService.deleteGroup(groupId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Group deleted successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getByCourseId(req: Request, res: Response): Promise<void> {
        const { courseId } = req.params;
        const result = await groupService.getGroupsByCourseId(courseId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Groups fetched successfully',
            data: result,
        });
    }
}

export default Group;
