import type { NextFunction, Request, Response } from 'express';

export function CatchAsync() {
    return function (target: any, key: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = function (...args: any[]) {
            const [req, res, next] = args as [Request, Response, NextFunction];
            Promise.resolve(originalMethod.apply(this, args)).catch(next);
        };

        return descriptor;
    };
}
