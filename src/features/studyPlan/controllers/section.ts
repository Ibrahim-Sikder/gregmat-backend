import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import studyPlanService from '@service/db/studyPlan.service';
import { SectionSchema, updateSectionSchema } from '@studyPlan/schemas/section';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class SectionController {
    @CatchAsync()
    @ZodValidation(SectionSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await studyPlanService.createSection(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Section created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await studyPlanService.getAllSections();
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'All sections fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getByPlanId(req: Request, res: Response): Promise<void> {
        const { planId } = req.params;
        const result = await studyPlanService.getSectionsByPlanId(planId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Sections fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { sectionId } = req.params;
        const result = await studyPlanService.getSectionById(sectionId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Section fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(updateSectionSchema)
    public async update(req: Request, res: Response): Promise<void> {
        const { sectionId } = req.params;
        const result = await studyPlanService.updateSection(sectionId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Section updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { sectionId } = req.params;
        await studyPlanService.deleteSection(sectionId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Section deleted successfully',
            data: null,
        });
    }
}

export default SectionController;
