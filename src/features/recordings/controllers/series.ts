import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import { seriesSchema } from '@recordings/schemas/series';
import seriesService from '@service/db/series.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class Series {
    @CatchAsync()
    @ZodValidation(seriesSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await seriesService.createSeries(req.body);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Series created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await seriesService.getAllSeries(req.query);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'All series fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { seriesId } = req.params;
        const result = await seriesService.getSeriesById(seriesId);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Series fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(seriesSchema)
    public async update(req: Request, res: Response): Promise<void> {
        const { seriesId } = req.params;
        const result = await seriesService.updateSeries(seriesId, req.body);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Series updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { seriesId } = req.params;
        const result = await seriesService.deleteSeries(seriesId);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Series deleted successfully',
            data: result,
        });
    }
}

export default Series;
