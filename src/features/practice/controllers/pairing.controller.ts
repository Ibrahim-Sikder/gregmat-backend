import type { Request, Response } from 'express';
import { pairingService } from '@service/db/pairing.service';
import { StatusCodes } from 'http-status-codes';
import { CatchAsync } from '@global/decorators/catch-async';
import sendResponse from '@global/helpers/sendResponse';

export class PairingController {
    @CatchAsync()
    public async getPairings(req: Request, res: Response): Promise<void> {
        const { page = '1', limit = '50', search, sort } = req.query;
        const result = await pairingService.getPairings(req.currentUser!.userId, {
            page: Number(page),
            limit: Number(limit),
            search: search as string,
            sort: sort as string,
        });

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Pairings fetched successfully',
            data: result.data,
            meta: result.meta,
        });
    }

    @CatchAsync()
    public async getPairing(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const pairing = await pairingService.getPairingById(req.currentUser!.userId, id);

        if (!pairing) {
            sendResponse(res, {
                statusCode: StatusCodes.NOT_FOUND,
                success: false,
                message: 'Pairing not found',
                data: null,
            });
            return;
        }

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Pairing fetched successfully',
            data: pairing,
        });
    }

    @CatchAsync()
    public async createPairing(req: Request, res: Response): Promise<void> {
        const pairing = await pairingService.createPairing(req.body);

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: 'Pairing created successfully',
            data: pairing,
        });
    }

    @CatchAsync()
    public async submitAttempt(req: Request, res: Response): Promise<void> {
        const { pairingId, score, correct, attempt } = req.body;
        const result = await pairingService.submitAttempt(req.currentUser!.userId, pairingId, {
            score,
            correct,
            attempt,
        });

        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: 'Attempt submitted successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async resetProgress(req: Request, res: Response): Promise<void> {
        await pairingService.resetProgress(req.currentUser!.userId);

        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Progress reset successfully',
            data: null,
        });
    }
}
