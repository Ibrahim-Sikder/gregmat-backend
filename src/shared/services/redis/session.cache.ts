import type { IActiveSession } from '@auth/interfaces/auth.interface';
import { ServerError } from '@global/helpers/error-handlers';
import { config } from '@root/config';
import { BaseCache } from '@service/redis/base.cache';
import type Logger from 'bunyan';
import crypto from 'crypto';

const log: Logger = config.createLogger('sessionCache');

interface ISessionWithId extends IActiveSession {
    // Contains sessionId for tracking
}

class SessionCache extends BaseCache {
    constructor() {
        super('sessionCache');
    }

    /**
     * Generate a device fingerprint from user agent and IP
     */
    private generateDeviceFingerprint(ip: string, userAgent: string): string {
        return crypto.createHash('sha256').update(`${ip}:${userAgent}`).digest('hex');
    }

    /**
     * Save a new active session (supports multiple sessions per user)
     */
    public async saveActiveSession(
        sessionData: IActiveSession,
        expirationInSeconds: number = 24 * 60 * 60 // 24 hours
    ): Promise<void> {
        try {
            await this.ensureConnected();

            const deviceId =
                sessionData.deviceId ||
                this.generateDeviceFingerprint(sessionData.ip, sessionData.userAgent);

            const sessionKey = `session:${sessionData.userId}:${sessionData.sessionId}`;
            const userSessionsKey = `user_sessions:${sessionData.userId}`;

            const serializedData = JSON.stringify({
                ...sessionData,
                deviceId,
                loginTime: sessionData.loginTime.toISOString(),
                lastActivity: sessionData.lastActivity.toISOString(),
            });

            // Save individual session
            await this.client.SETEX(sessionKey, expirationInSeconds, serializedData);

            // Add to user's session set for tracking
            await this.client.SADD(userSessionsKey, sessionData.sessionId);
            await this.client.EXPIRE(userSessionsKey, expirationInSeconds);

            log.info(
                `Active session saved for user: ${sessionData.userId}, sessionId: ${sessionData.sessionId}`
            );
        } catch (error) {
            log.error('Error saving active session:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    /**
     * Get a specific session by sessionId
     */
    public async getActiveSession(
        userId: string,
        sessionId?: string
    ): Promise<IActiveSession | null> {
        try {
            await this.ensureConnected();

            // If sessionId provided, get that specific session
            if (sessionId) {
                const sessionKey = `session:${userId}:${sessionId}`;
                const sessionData = await this.client.GET(sessionKey);

                if (!sessionData) {
                    return null;
                }

                const parsed = JSON.parse(sessionData);
                return {
                    ...parsed,
                    loginTime: new Date(parsed.loginTime),
                    lastActivity: new Date(parsed.lastActivity),
                } as IActiveSession;
            }

            // Legacy: Get first/primary session (for backwards compatibility)
            const userSessionsKey = `user_sessions:${userId}`;
            const sessionIds = await this.client.SMEMBERS(userSessionsKey);

            if (sessionIds.length === 0) {
                return null;
            }

            const sessionKey = `session:${userId}:${sessionIds[0]}`;
            const sessionData = await this.client.GET(sessionKey);

            if (!sessionData) {
                return null;
            }

            const parsed = JSON.parse(sessionData);
            return {
                ...parsed,
                loginTime: new Date(parsed.loginTime),
                lastActivity: new Date(parsed.lastActivity),
            } as IActiveSession;
        } catch (error) {
            log.error('Error getting active session:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    /**
     * Get all active sessions for a user
     */
    public async getAllUserSessions(userId: string): Promise<IActiveSession[]> {
        try {
            await this.ensureConnected();

            const userSessionsKey = `user_sessions:${userId}`;
            const sessionIds = await this.client.SMEMBERS(userSessionsKey);

            if (sessionIds.length === 0) {
                return [];
            }

            const sessions: IActiveSession[] = [];

            for (const sessionId of sessionIds) {
                const sessionKey = `session:${userId}:${sessionId}`;
                const sessionData = await this.client.GET(sessionKey);

                if (sessionData) {
                    const parsed = JSON.parse(sessionData);
                    sessions.push({
                        ...parsed,
                        loginTime: new Date(parsed.loginTime),
                        lastActivity: new Date(parsed.lastActivity),
                    } as IActiveSession);
                } else {
                    // Clean up orphaned session ID
                    await this.client.SREM(userSessionsKey, sessionId);
                }
            }

            return sessions;
        } catch (error) {
            log.error('Error getting all user sessions:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    /**
     * Get count of active sessions for a user
     */
    public async getUserSessionCount(userId: string): Promise<number> {
        try {
            await this.ensureConnected();

            const userSessionsKey = `user_sessions:${userId}`;
            const count = await this.client.SCARD(userSessionsKey);

            return count;
        } catch (error) {
            log.error('Error getting user session count:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    /**
     * Update session activity
     */
    public async updateSessionActivity(userId: string, sessionId: string): Promise<void> {
        try {
            await this.ensureConnected();

            const sessionKey = `session:${userId}:${sessionId}`;
            const sessionData = await this.client.GET(sessionKey);

            if (sessionData) {
                const parsed = JSON.parse(sessionData);
                parsed.lastActivity = new Date().toISOString();

                const ttl = await this.client.TTL(sessionKey);
                const expiration = ttl > 0 ? ttl : 24 * 60 * 60;

                await this.client.SETEX(sessionKey, expiration, JSON.stringify(parsed));
                log.info(`Session activity updated for user: ${userId}, sessionId: ${sessionId}`);
            }
        } catch (error) {
            log.error('Error updating session activity:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    /**
     * Delete a specific user session
     */
    public async deleteUserSession(userId: string, sessionId?: string): Promise<void> {
        try {
            await this.ensureConnected();

            if (sessionId) {
                const sessionKey = `session:${userId}:${sessionId}`;
                const userSessionsKey = `user_sessions:${userId}`;

                await this.client.DEL(sessionKey);
                await this.client.SREM(userSessionsKey, sessionId);

                log.info(`Session terminated for user: ${userId}, sessionId: ${sessionId}`);
            } else {
                // Delete all sessions for user (legacy)
                const userSessionsKey = `user_sessions:${userId}`;
                const sessionIds = await this.client.SMEMBERS(userSessionsKey);

                for (const id of sessionIds) {
                    const sessionKey = `session:${userId}:${id}`;
                    await this.client.DEL(sessionKey);
                }

                await this.client.DEL(userSessionsKey);
                log.info(`All sessions terminated for user: ${userId}`);
            }
        } catch (error) {
            log.error('Error deleting user session:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    public async addToSessionBlacklist(
        userId: string,
        reason: string = 'terminated',
        expirationInSeconds: number = 24 * 60 * 60
    ): Promise<void> {
        try {
            await this.ensureConnected();

            const blacklistKey = `session_blacklist:${userId}`;
            const blacklistData = JSON.stringify({
                reason,
                timestamp: new Date().toISOString(),
            });

            await this.client.SETEX(blacklistKey, expirationInSeconds, blacklistData);
            log.info(`Session blacklisted for user: ${userId}, reason: ${reason}`);
        } catch (error) {
            log.error('Error adding to session blacklist:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    public async isSessionBlacklisted(userId: string): Promise<boolean> {
        try {
            await this.ensureConnected();

            const blacklistKey = `session_blacklist:${userId}`;
            const blacklistData = await this.client.GET(blacklistKey);
            return !!blacklistData;
        } catch (error) {
            log.error('Error checking session blacklist:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }

    public async removeFromSessionBlacklist(userId: string): Promise<void> {
        try {
            await this.ensureConnected();

            const blacklistKey = `session_blacklist:${userId}`;
            await this.client.DEL(blacklistKey);
            log.info(`User removed from session blacklist: ${userId}`);
        } catch (error) {
            log.error('Error removing from session blacklist:', error);
            throw new ServerError('Server error. Try again later.');
        }
    }
}

const sessionCache = new SessionCache();

export default sessionCache;
