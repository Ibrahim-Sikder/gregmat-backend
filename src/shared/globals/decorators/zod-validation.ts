import type { ZodTypeAny } from 'zod';
import { ZodError as ZodNativeError, ZodError } from 'zod';
import { ZodValidationError } from '@global/helpers/error-handlers';

type IZodDecorator = (
    target: any,
    key: string,
    descriptor: PropertyDescriptor
) => PropertyDescriptor;

export function ZodValidation(schema: ZodTypeAny, asyncValidation = false): IZodDecorator {
    return function (target: any, key: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            const req: Request = args[0];
            try {
                let parsedData;

                if (asyncValidation && schema.parseAsync) {
                    // Async validation
                    parsedData = await schema.parseAsync(req.body || {});
                } else {
                    // Sync validation
                    const result = schema.safeParse(req.body || {});
                    if (!result.success) {
                        throw new ZodValidationError(result.error);
                    }
                }

                return originalMethod.apply(this, args);
            } catch (err: any) {
                if (err instanceof ZodNativeError) {
                    throw new ZodValidationError(err);
                }
                throw err;
            }
        };

        return descriptor;
    };
}
