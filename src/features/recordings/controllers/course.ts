import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import { courseSchema, updateCourseSchema } from '@recordings/schemas/course';
import courseService from '@service/db/course.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class Course {
    @CatchAsync()
    @ZodValidation(courseSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await courseService.createCourse(req.body);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Series created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await courseService.getAllCourses(req.query);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'All courses fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { courseId } = req.params;
        const result = await courseService.getCourseById(courseId);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Course fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(updateCourseSchema)
    public async update(req: Request, res: Response): Promise<void> {
        const { courseId } = req.params;
        const result = await courseService.updateCourse(courseId, req.body);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Course updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { courseId } = req.params;
        const result = await courseService.deleteCourse(courseId);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Course deleted successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getCourseBySlug(req: Request, res: Response): Promise<void> {
        const { slug } = req.params;
        const result = await courseService.getCourseBySlug(slug);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Course fetched successfully by slug',
            data: result,
        });
    }

    @CatchAsync()
    public async getCoursesBySeriesId(req: Request, res: Response): Promise<void> {
        const { seriesId } = req.params;
        const result = await courseService.getCoursesBySeriesId(seriesId);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Courses fetched successfully by series ID',
            data: result,
        });
    }
}

export default Course;
