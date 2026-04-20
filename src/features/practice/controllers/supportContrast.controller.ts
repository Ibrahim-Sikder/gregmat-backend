import type { Request, Response } from 'express';
import { supportContrastService } from '@service/db/supportContrast.service';
import HTTP_STATUS from 'http-status-codes';

export class SupportContrastController {
    public async getAll(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser!.userId;
        const { page, limit, search, sort } = req.query;
        const result = await supportContrastService.getSupportContrasts(userId, {
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            search: search as string,
            sort: sort as string,
        });
        res.status(HTTP_STATUS.OK).json({
            message: 'Support Contrasts fetched successfully',
            ...result,
        });
    }

    public async getById(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser!.userId;
        const result = await supportContrastService.getSupportContrastById(userId, req.params.id);
        if (!result) {
            res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Support Contrast not found' });
            return;
        }
        res.status(HTTP_STATUS.OK).json({
            message: 'Support Contrast fetched successfully',
            data: result,
        });
    }

    public async submitAttempt(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser!.userId;
        const { supportContrastId, blank_index, reasoning_type, associated_token, correct } =
            req.body;
        const attempt = await supportContrastService.submitAttempt(userId, supportContrastId, {
            blank_index,
            reasoning_type,
            associated_token,
            correct,
        });
        res.status(HTTP_STATUS.CREATED).json({
            message: 'Attempt submitted successfully',
            data: attempt,
        });
    }

    public async resetProgress(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser!.userId;
        await supportContrastService.resetProgress(userId);
        res.status(HTTP_STATUS.OK).json({ message: 'Progress reset successfully' });
    }

    public async resetAttempt(req: Request, res: Response): Promise<void> {
        const userId = req.currentUser!.userId;
        const { supportContrastId, blank_index } = req.body;
        await supportContrastService.resetAttempt(userId, supportContrastId, blank_index);
        res.status(HTTP_STATUS.OK).json({ message: 'Attempt reset successfully' });
    }
}
