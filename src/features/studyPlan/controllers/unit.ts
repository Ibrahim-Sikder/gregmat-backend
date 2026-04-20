import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import studyPlanService from '@service/db/studyPlan.service';
import { UnitUpdateZodSchema, UnitZodSchema } from '@studyPlan/schemas/unit';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class UnitController {
    @CatchAsync()
    @ZodValidation(UnitZodSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await studyPlanService.createUnit(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Unit created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await studyPlanService.getAllUnits();
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'All units fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getUnitsBySectionId(req: Request, res: Response): Promise<void> {
        const { sectionId } = req.params;
        const result = await studyPlanService.getUnitsBySectionId(sectionId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Units fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { unitId } = req.params;
        const result = await studyPlanService.getUnitById(unitId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Unit fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(UnitUpdateZodSchema)
    public async update(req: Request, res: Response): Promise<void> {
        const { unitId } = req.params;
        const result = await studyPlanService.updateUnit(unitId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Unit updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { unitId } = req.params;
        const result = await studyPlanService.deleteUnit(unitId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Unit deleted successfully',
            data: result,
        });
    }
}

export default UnitController;
