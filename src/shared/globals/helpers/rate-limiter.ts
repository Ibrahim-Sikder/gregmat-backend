import { config } from '@root/config';
import type { Request, Response, NextFunction } from 'express';
import HTTP_STATUS from 'http-status-codes';
import type Logger from 'bunyan';

const log: Logger = config.createLogger('RateLimiter');

interface RateLimitStore {
    [key: string]: {
        count: number;
        resetTime: number;
    };
}

class RateLimiter {
    private store: RateLimitStore = {};

    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Cleanup old entries every minute
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 60000);
    }

    private cleanup(): void {
        const now = Date.now();
        Object.keys(this.store).forEach((key) => {
            if (this.store[key].resetTime < now) {
                delete this.store[key];
            }
        });
    }

    public limit(maxRequests: number, windowMs: number) {
        return (req: Request, res: Response, next: NextFunction): Response | void => {
            const identifier = req.ip || req.socket.remoteAddress || 'unknown';
            const key = `${identifier}:${req.path}`;
            const now = Date.now();

            if (!this.store[key] || this.store[key].resetTime < now) {
                this.store[key] = {
                    count: 1,
                    resetTime: now + windowMs,
                };
                return next();
            }

            this.store[key].count++;

            if (this.store[key].count > maxRequests) {
                const retryAfter = Math.ceil((this.store[key].resetTime - now) / 1000);
                res.setHeader('Retry-After', retryAfter);
                res.setHeader('X-RateLimit-Limit', maxRequests);
                res.setHeader('X-RateLimit-Remaining', 0);
                res.setHeader(
                    'X-RateLimit-Reset',
                    new Date(this.store[key].resetTime).toISOString()
                );

                log.warn(`Rate limit exceeded for IP: ${identifier} on path: ${req.path}`);

                return res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
                    status: 'error',
                    statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
                    message: `Too many requests. Please try again after ${retryAfter} seconds.`,
                });
            }

            res.setHeader('X-RateLimit-Limit', maxRequests);
            res.setHeader('X-RateLimit-Remaining', maxRequests - this.store[key].count);
            res.setHeader('X-RateLimit-Reset', new Date(this.store[key].resetTime).toISOString());

            next();
        };
    }

    public destroy(): void {
        clearInterval(this.cleanupInterval);
    }
}

export const rateLimiter = new RateLimiter();

// Predefined rate limiters
export const strictRateLimit = rateLimiter.limit(10, 60000); // 10 requests per minute
export const moderateRateLimit = rateLimiter.limit(100, 60000); // 100 requests per minute
export const generalRateLimit = rateLimiter.limit(1000, 60000); // 1000 requests per minute
