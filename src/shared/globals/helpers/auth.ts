import type { AuthPayload } from '@auth/interfaces/auth.interface';
import { NotAuthorizedError } from '@global/helpers/error-handlers';
import { config } from '@root/config';
import { authService } from '@service/db/auth.service';
import SessionManager from '@service/db/session.service';
import type { NextFunction, Request, Response } from 'express';
import JWT, { TokenExpiredError } from 'jsonwebtoken';

class AuthMiddleware {
    public async verifyUser(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const token = req.session?.jwt || req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                req.session = null;
                req.cookies = {};
                throw new NotAuthorizedError('UNAUTHORIZED');
            }

            const payload: AuthPayload = JWT.verify(token, config.JWT_TOKEN!) as AuthPayload;

            const authUser = await authService.getAuthUserByEmail(payload.email);
            if (!authUser) {
                req.session = null;
                req.cookies = {};
                await SessionManager.terminateExistingSession(payload.userId);
                throw new NotAuthorizedError('UNAUTHORIZED');
            }

            if (authUser.isBlocked) {
                req.session = null;
                req.cookies = {};
                await SessionManager.terminateExistingSession(payload.userId);
                await authService.updateAuthUser(authUser._id.toString(), {
                    currentSessionId: undefined,
                });
                throw new NotAuthorizedError('This account is blocked. Please contact support.');
            }

            if (await SessionManager.shouldBlockUser(authUser)) {
                req.session = null;
                req.cookies = {};
                if (authUser.currentSessionId) {
                    await SessionManager.terminateExistingSession(payload.userId);
                    await authService.updateAuthUser(authUser._id.toString(), {
                        currentSessionId: undefined,
                    });
                }
                throw new NotAuthorizedError(
                    `Account is blocked. ${authUser.blockReason || 'Please contact support.'}`
                );
            }

            const isBlacklisted = await SessionManager.isSessionBlacklisted(payload.userId);
            if (isBlacklisted) {
                req.session = null;
                req.cookies = {};
                await SessionManager.terminateExistingSession(payload.userId);
                throw new NotAuthorizedError('UNAUTHORIZED');
            }

            const activeSession = await SessionManager.getActiveSession(
                payload.userId,
                payload.sessionId
            );
            if (!activeSession || activeSession.sessionId !== payload.sessionId) {
                req.session = null;
                req.cookies = {};
                await SessionManager.terminateExistingSession(payload.userId, payload.sessionId);
                throw new NotAuthorizedError('UNAUTHORIZED');
            }

            await SessionManager.updateSessionActivity(payload.userId, payload.sessionId);

            req.currentUser = {
                ...payload,
                isBlocked: authUser.isBlocked,
            };
            next();
        } catch (error) {
            if (error instanceof TokenExpiredError) {
                try {
                    const token =
                        req.session?.jwt || req.headers.authorization?.replace('Bearer ', '');
                    if (token) {
                        const decoded: any = JWT.decode(token);
                        if (decoded?.userId) {
                            await SessionManager.terminateExistingSession(decoded.userId);
                            await authService.updateAuthUser(decoded.userId, {
                                currentSessionId: undefined,
                            });
                        }
                    }
                } catch (innerError) {
                    throw new NotAuthorizedError('Session expired. Please log in again.');
                }

                req.session = null;
                req.cookies = {};
                throw new NotAuthorizedError('Session expired. Please log in again.');
            }

            if (error instanceof JWT.JsonWebTokenError) {
                req.session = null;
                req.cookies = {};
                throw new NotAuthorizedError('UNAUTHORIZED');
            }
            throw error;
        }
    }

    public async checkAuthentication(
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> {
        try {
            const token = req.session?.jwt || req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                // If no token, continue without user info
                return next();
            }

            const payload: AuthPayload = JWT.verify(token, config.JWT_TOKEN!) as AuthPayload;

            const authUser = await authService.getAuthUserByEmail(payload.email);
            if (!authUser) {
                // Invalid token, continue without user info
                return next();
            }

            if (authUser.isBlocked) {
                // Blocked user, continue without user info
                return next();
            }

            const isBlacklisted = await SessionManager.isSessionBlacklisted(payload.userId);
            if (isBlacklisted) {
                // Blacklisted session, continue without user info
                return next();
            }

            const activeSession = await SessionManager.getActiveSession(
                payload.userId,
                payload.sessionId
            );
            if (!activeSession || activeSession.sessionId !== payload.sessionId) {
                // Invalid session, continue without user info
                return next();
            }

            await SessionManager.updateSessionActivity(payload.userId, payload.sessionId);

            req.currentUser = {
                ...payload,
                isBlocked: authUser.isBlocked,
            };
            next();
        } catch (error) {
            // On any error, just continue without authentication
            next();
        }
    }
}

const authMiddleware = new AuthMiddleware();
export default authMiddleware;
