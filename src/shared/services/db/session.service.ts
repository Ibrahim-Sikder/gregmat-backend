import type { IActiveSession, IAuthDocument } from '@auth/interfaces/auth.interface';
import sessionCache from '@service/redis/session.cache';
import crypto from 'crypto';
import { authService } from './auth.service';
import userService from './user.service';

class SessionManager {
    private static readonly MAX_SUSPICIOUS_ATTEMPTS = 3;

    private static readonly BLOCK_DURATION = 3 * 60 * 1000; // 3 minutes

    private static readonly SUSPICIOUS_LOGIN_WINDOW = 10 * 60 * 1000; // 10 minutes

    private static readonly MAX_CONCURRENT_SESSIONS = 3; // Max devices per account

    static generateSessionId(): string {
        return crypto.randomUUID();
    }

    /**
     * Check if a new login would exceed max concurrent sessions
     * Returns the oldest session if limit is exceeded, null otherwise
     */
    static async checkConcurrentSessionLimit(userId: string): Promise<IActiveSession | null> {
        const currentSessionCount = await sessionCache.getUserSessionCount(userId);

        if (currentSessionCount >= this.MAX_CONCURRENT_SESSIONS) {
            // Get all sessions and return the oldest one to evict
            const sessions = await sessionCache.getAllUserSessions(userId);
            if (sessions.length > 0) {
                // Sort by loginTime and return the oldest
                sessions.sort(
                    (a, b) => new Date(a.loginTime).getTime() - new Date(b.loginTime).getTime()
                );
                return sessions[0];
            }
        }

        return null;
    }

    static async shouldBlockUser(authUser: IAuthDocument): Promise<boolean> {
        const now = new Date();

        // Check if user was blocked but the block period has expired
        if (authUser.blockedUntil && authUser.blockedUntil <= now) {
            // Block period has expired, auto-unblock the user
            await authService.updateAuthUser(authUser._id.toString(), {
                isBlocked: false,
                suspiciousLoginAttempts: 0,
                failedLoginAttempts: 0,
                blockReason: undefined,
                blockedUntil: undefined,
                lastFailedLogin: undefined,
                lastSuspiciousLogin: undefined,
            });

            const user = await userService.getUserByAuthId(`${authUser._id}`);
            if (user) {
                await this.removeFromSessionBlacklist(`${user._id}`);
            }

            return false;
        }

        // Check if user is still temporarily blocked due to blockedUntil time
        if (authUser.blockedUntil && authUser.blockedUntil > now) {
            return true;
        }

        // Check if user is blocked due to suspicious login attempts (only if not expired)
        if (
            authUser.suspiciousLoginAttempts &&
            authUser.suspiciousLoginAttempts >= this.MAX_SUSPICIOUS_ATTEMPTS &&
            authUser.isBlocked
        ) {
            return true;
        }

        // Check if user is generally blocked
        if (authUser.isBlocked) {
            return true;
        }

        return false;
    }

    static async handleSuspiciousLogin(
        authUser: IAuthDocument,
        ip: string,
        userAgent: string
    ): Promise<void> {
        const now = new Date();

        const windowStart = new Date(now.getTime() - this.SUSPICIOUS_LOGIN_WINDOW);

        // Reset counter if outside window
        if (!authUser.lastSuspiciousLogin || authUser.lastSuspiciousLogin < windowStart) {
            authUser.suspiciousLoginAttempts = 1;
        } else {
            authUser.suspiciousLoginAttempts = (authUser.suspiciousLoginAttempts || 0) + 1;
        }

        authUser.lastSuspiciousLogin = now;

        // Block if exceeded attempts
        if (authUser.suspiciousLoginAttempts >= this.MAX_SUSPICIOUS_ATTEMPTS) {
            authUser.isBlocked = true;
            authUser.blockReason = 'Multiple suspicious login attempts detected';
            authUser.blockedUntil = new Date(now.getTime() + this.BLOCK_DURATION);

            if (authUser.currentSessionId) {
                const user = await userService.getUserByAuthId(`${authUser._id}`);

                if (user) {
                    await this.terminateExistingSession(`${user._id}`);
                }
            }
        }

        await authService.updateAuthUser(authUser._id.toString(), {
            suspiciousLoginAttempts: authUser.suspiciousLoginAttempts,
            lastSuspiciousLogin: authUser.lastSuspiciousLogin,
            isBlocked: authUser.isBlocked,
            blockReason: authUser.blockReason,
            blockedUntil: authUser.blockedUntil,
            currentSessionId: authUser.isBlocked ? undefined : authUser.currentSessionId,
        });
    }

    static async cleanupSessionOnSignout(userId: string): Promise<void> {
        await sessionCache.deleteUserSession(userId);

        const user = await userService.getUserById(userId);
        if (user?.auth) {
            await authService.updateAuthUser(user.auth.toString(), {
                currentSessionId: undefined,
            });
        }
    }

    static async terminateExistingSession(userId: string, sessionId?: string): Promise<void> {
        if (sessionId) {
            // Terminate specific session
            const activeSession = await sessionCache.getActiveSession(userId, sessionId);

            if (activeSession) {
                await sessionCache.addToSessionBlacklist(
                    userId,
                    'new_login_detected',
                    24 * 60 * 60
                );
            }
            await sessionCache.deleteUserSession(userId, sessionId);
        } else {
            // Terminate all sessions (legacy)
            const activeSession = await sessionCache.getActiveSession(userId);

            if (activeSession) {
                await sessionCache.addToSessionBlacklist(
                    userId,
                    'new_login_detected',
                    24 * 60 * 60
                );
            }
            await sessionCache.deleteUserSession(userId);
        }
    }

    static async createActiveSession(sessionData: IActiveSession): Promise<void> {
        await sessionCache.saveActiveSession(sessionData, 24 * 60 * 60); // 24 hours
    }

    static async isSessionBlacklisted(userId: string): Promise<boolean> {
        return await sessionCache.isSessionBlacklisted(userId);
    }

    static async removeFromSessionBlacklist(userId: string): Promise<void> {
        await sessionCache.removeFromSessionBlacklist(userId);
    }

    static async getActiveSession(
        userId: string,
        sessionId?: string
    ): Promise<IActiveSession | null> {
        return await sessionCache.getActiveSession(userId, sessionId);
    }

    static async getAllUserSessions(userId: string): Promise<IActiveSession[]> {
        return await sessionCache.getAllUserSessions(userId);
    }

    static async updateSessionActivity(userId: string, sessionId: string): Promise<void> {
        await sessionCache.updateSessionActivity(userId, sessionId);
    }
}

export default SessionManager;
