import HTTP_STATUS from 'http-status-codes';
import { ZodError } from 'zod';

export interface IErrorResponse {
    message: string;
    statusCode: number;
    status: string;
    serializeErrors(): IError;
}

export interface IError {
    message: string;
    statusCode: number;
    status: string;
}

export abstract class CustomError extends Error {
    abstract statusCode: number;

    abstract status: string;

    constructor(message: string) {
        super(message);
    }

    serializeErrors(): IError {
        return {
            message: this.message,
            status: this.status,
            statusCode: this.statusCode,
        };
    }
}

export class BadRequestError extends CustomError {
    statusCode = HTTP_STATUS.BAD_REQUEST;

    status = 'error';

    constructor(message: string) {
        super(message);
    }
}

export class NotFoundError extends CustomError {
    statusCode = HTTP_STATUS.NOT_FOUND;

    status = 'error';

    constructor(message: string) {
        super(message);
    }
}

export class NotAuthorizedError extends CustomError {
    statusCode = HTTP_STATUS.UNAUTHORIZED;

    status = 'error';

    constructor(message: string) {
        super(message);
    }
}

export class FileTooLargeError extends CustomError {
    statusCode = HTTP_STATUS.REQUEST_TOO_LONG;

    status = 'error';

    constructor(message: string) {
        super(message);
    }
}

export class ServerError extends CustomError {
    statusCode = HTTP_STATUS.SERVICE_UNAVAILABLE;

    status = 'error';

    constructor(message: string) {
        super(message);
    }
}

export class ZodValidationError extends CustomError {
    statusCode = HTTP_STATUS.BAD_REQUEST;

    status = 'error';

    public errors: any;

    constructor(error: string | ZodError) {
        super(typeof error === 'string' ? error : 'Validation failed');

        if (error instanceof ZodError) {
            const flattened = error.flatten();
            const formErrors: string[] = [];
            const fieldErrors: Record<string, string[]> = {};

            flattened.formErrors.forEach((msg) => {
                if (msg.includes('expected object, received undefined')) {
                    formErrors.push('Form data is missing');
                } else {
                    formErrors.push(msg);
                }
            });

            Object.entries(flattened.fieldErrors).forEach(([field, errors]) => {
                fieldErrors[field] = Array.isArray(errors)
                    ? (errors as string[]).map((msg) => msg)
                    : [];
            });

            this.errors = { formErrors, fieldErrors };
        } else {
            this.errors = {
                formErrors: [error],
                fieldErrors: {},
            };
        }
    }

    serializeErrors(): IError & { errors?: any } {
        return {
            message: this.message,
            status: this.status,
            statusCode: this.statusCode,
            errors: this.errors || undefined, // structured object
        };
    }
}
