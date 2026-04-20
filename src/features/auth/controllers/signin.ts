import type { IActiveSession, IAuthDocument } from '@auth/interfaces/auth.interface';
import { signinSchema } from '@auth/schemas/signin';
import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import { BadRequestError } from '@global/helpers/error-handlers';
import { config } from '@root/config';
import { authService } from '@service/db/auth.service';
import SessionManager from '@service/db/session.service';
import userService from '@service/db/user.service';
import userCache from '@service/redis/user.cache';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import JWT from 'jsonwebtoken';
import SignUp from './signup';

class SignIn {
    @CatchAsync()
    @ZodValidation(signinSchema)
    public async execute(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || 'unknown';

        let authUser = await SignIn.prototype.validateUserCredentials(email, password);

        await SignIn.prototype.checkUserBlockStatus(authUser);

        authUser = await SignIn.prototype.handleSuspiciousLoginCheck(authUser, ip, userAgent);

        await SignIn.prototype.handleSuccessfulLogin(authUser, ip, userAgent, res, req);
    }

    private async validateUserCredentials(email: string, password: string): Promise<IAuthDocument> {
        const existingUser = await authService.getAuthUserByEmail(email);

        if (!existingUser) {
            throw new BadRequestError('Invalid credentials');
        }

        if (existingUser.provider === 'credentials' && !existingUser.isEmailVerified) {
            throw new BadRequestError('Please verify your email before logging in');
        }

        if (existingUser.provider === 'credentials') {
            const passwordsMatch = await existingUser.comparePassword(password);
            if (!passwordsMatch) {
                await this.handleFailedLogin(existingUser);
                throw new BadRequestError('Invalid credentials');
            }
        }

        return existingUser;
    }

    private async checkUserBlockStatus(authUser: IAuthDocument): Promise<void> {
        if (await SessionManager.shouldBlockUser(authUser)) {
            throw new BadRequestError(
                `Account is temporarily blocked. ${authUser.blockReason || 'Please try again later.'}`
            );
        }
    }

    private async handleSuspiciousLoginCheck(
        authUser: IAuthDocument,
        ip: string,
        userAgent: string
    ): Promise<IAuthDocument> {
        const isDifferentIP = authUser.lastLoginIP && authUser.lastLoginIP !== ip;
        const isDifferentDevice =
            authUser.lastLoginDevice && authUser.lastLoginDevice !== userAgent;

        // Handle suspicious login if different IP or device and user has an active session
        if ((isDifferentIP || isDifferentDevice) && authUser.currentSessionId) {
            await SessionManager.handleSuspiciousLogin(authUser, ip, userAgent);

            const updatedAuthUser = await authService.getAuthUserByEmail(authUser.email);
            if (!updatedAuthUser) {
                throw new BadRequestError('Invalid credentials');
            }

            // Check if user got blocked during suspicious login handling
            if (await SessionManager.shouldBlockUser(updatedAuthUser)) {
                // Terminate any existing sessions for blocked user
                if (updatedAuthUser.currentSessionId) {
                    const user = await userService.getUserByAuthId(`${updatedAuthUser._id}`);
                    if (user) {
                        await SessionManager.terminateExistingSession(
                            `${user._id}`,
                            updatedAuthUser.currentSessionId
                        );
                    }

                    // Clear session from auth document
                    await authService.updateAuthUser(updatedAuthUser._id.toString(), {
                        currentSessionId: undefined,
                    });
                }
                throw new BadRequestError('Account temporarily blocked due to suspicious activity');
            }

            return updatedAuthUser;
        }

        return authUser;
    }

    private async handleSuccessfulLogin(
        authUser: IAuthDocument,
        ip: string,
        userAgent: string,
        res: Response,
        req: Request
    ): Promise<void> {
        const user = await userService.getUserByAuthId(`${authUser._id}`);
        if (!user) {
            throw new BadRequestError('Invalid email or password');
        }

        const userId = `${user._id}`;

        // ===== CRITICAL: Check max concurrent sessions limit =====
        const oldestSession = await SessionManager.checkConcurrentSessionLimit(userId);

        if (oldestSession) {
            // Max sessions exceeded - automatically logout all previous sessions
            const existingSessions = await SessionManager.getAllUserSessions(userId);
            for (const session of existingSessions) {
                await SessionManager.terminateExistingSession(userId, session.sessionId);
            }
        }

        // Generate new session
        const sessionId = SessionManager.generateSessionId();
        const sessionData: IActiveSession = {
            sessionId,
            userId,
            ip,
            userAgent,
            loginTime: new Date(),
            lastActivity: new Date(),
            provider: authUser.provider,
        };

        // Create the new session
        await SessionManager.createActiveSession(sessionData);
        await SessionManager.removeFromSessionBlacklist(userId);

        // Update auth user with latest session info
        await authService.updateAuthUser(authUser._id.toString(), {
            currentSessionId: sessionId,
            lastLoginIP: ip,
            lastLoginDevice: userAgent,
            failedLoginAttempts: 0,
            lastFailedLogin: undefined,
            isBlocked: false,
            blockReason: undefined,
            blockedUntil: undefined,
        });

        // Generate JWT token
        const userJwt = JWT.sign(
            {
                userId: user._id,
                uId: authUser.uId,
                email: authUser.email,
                username: authUser.username,
                role: authUser.role,
                sessionId,
                provider: authUser.provider,
            },
            config.JWT_TOKEN!,
            { expiresIn: '24h' }
        );

        req.session = { jwt: userJwt };

        // Get or create user cache
        let userDocument = await userCache.getUserFromCache(`${user._id}`);

        if (!userDocument) {
            const userDataForCache = SignUp.prototype.userData(authUser, user._id);
            await userCache.saveUserToCache(`${user._id}`, `${authUser.uId}`, userDataForCache);
            userDocument = userDataForCache;
        }

        res.status(HTTP_STATUS.OK).json({
            message: 'Login successful',
            user: { ...userDocument, password: undefined },
            token: userJwt,
            sessionId,
        });
    }

    private async handleFailedLogin(authUser: IAuthDocument): Promise<void> {
        const failedAttempts = (authUser.failedLoginAttempts || 0) + 1;

        await authService.updateAuthUser(`${authUser._id}`, {
            failedLoginAttempts: failedAttempts,
            lastFailedLogin: new Date(),
        });

        // Block after 5 failed attempts
        if (failedAttempts >= 5) {
            const user = await userService.getUserByAuthId(`${authUser._id}`);
            if (user) {
                // Terminate all existing sessions
                const existingSessions = await SessionManager.getAllUserSessions(`${user._id}`);
                for (const session of existingSessions) {
                    await SessionManager.terminateExistingSession(`${user._id}`, session.sessionId);
                }
            }

            await authService.updateAuthUser(`${authUser._id}`, {
                isBlocked: true,
                blockReason: 'Too many failed login attempts',
                blockedUntil: new Date(Date.now() + 15 * 60 * 1000),
                currentSessionId: undefined,
            });
        }
    }
}

export default SignIn;
