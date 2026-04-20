import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import studyPlanService from '@service/db/studyPlan.service';
import { StudyPlanUpdateZodSchema, StudyPlanZodSchema } from '@studyPlan/schemas/plan';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class StudyPlanController {
    @CatchAsync()
    @ZodValidation(StudyPlanZodSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await studyPlanService.createPlan(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Study plan created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await studyPlanService.getAllPlans();
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'All study plans fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { planId } = req.params;
        const result = await studyPlanService.getPlanById(planId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Study plan fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(StudyPlanUpdateZodSchema)
    public async update(req: Request, res: Response): Promise<void> {
        const { planId } = req.params;
        const result = await studyPlanService.updatePlan(planId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Study plan updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { planId } = req.params;
        const result = await studyPlanService.deletePlan(planId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Study plan deleted successfully',
            data: result,
        });
    }
}

export default StudyPlanController;
