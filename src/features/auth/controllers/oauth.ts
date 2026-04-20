import { CatchAsync } from '@global/decorators/catch-async';
import { BadRequestError } from '@global/helpers/error-handlers';
import sendResponse from '@global/helpers/sendResponse';
import youTubeService from '@service/db/youtube.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class OAuth {
    @CatchAsync()
    public async getAuthUrl(req: Request, res: Response): Promise<void> {
        const authUrl = youTubeService.generateAuthUrl();

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'YouTube authentication URL generated',
            data: { authUrl },
        });
    }

    @CatchAsync()
    public async handleCallback(req: Request, res: Response): Promise<void> {
        const { code } = req.query;

        if (!code || typeof code !== 'string') {
            throw new BadRequestError('Authorization code is required');
        }

        const tokens = await youTubeService.exchangeCodeForTokens(code);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'YouTube authentication successful',
            data: {
                message: 'Add the refresh_token to your .env file as ADMIN_REFRESH_TOKEN',
                refresh_token: tokens.refresh_token,
            },
        });
    }

    @CatchAsync()
    public async checkAuthStatus(req: Request, res: Response): Promise<void> {
        try {
            await youTubeService.getAuthenticatedYouTube();

            sendResponse(res, {
                statusCode: HTTP_STATUS.OK,
                success: true,
                message: 'YouTube authentication is valid',
                data: { authenticated: true },
            });
        } catch (error: any) {
            sendResponse(res, {
                statusCode: HTTP_STATUS.UNAUTHORIZED,
                success: false,
                message: 'YouTube authentication failed',
                data: {
                    authenticated: false,
                    error: error.message,
                },
            });
        }
    }
}

export default OAuth;
