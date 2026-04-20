import { CatchAsync } from '@global/decorators/catch-async';
import SessionManager from '@service/db/session.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { config } from '@root/config';

export class SignOut {
    @CatchAsync()
    public async execute(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;
        if (currentUser?.userId) {
            await SessionManager.cleanupSessionOnSignout(currentUser.userId);
        }

        req.session = null;

        // Explicitly clear the session cookie
        const cookieOptions: {
            path: string;
            expires: Date;
            httpOnly: boolean;
            secure?: boolean;
            sameSite?: 'none' | 'lax' | 'strict';
            domain?: string;
        } = {
            path: '/',
            expires: new Date(0),
            httpOnly: true,
        };

        if (config.NODE_ENV === 'production') {
            cookieOptions.secure = true;
            cookieOptions.sameSite = 'none';
            cookieOptions.domain = '.gregmat.co';
        }

        res.clearCookie('session', cookieOptions);
        res.clearCookie('session.sig', cookieOptions);

        res.status(HTTP_STATUS.OK).json({
            message: 'Logout successful',
            user: {},
            token: '',
        });
    }
}
