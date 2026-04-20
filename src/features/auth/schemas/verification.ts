import * as z from 'zod';

export const resendVerificationSchema = z.object({
    email: z
        .string()
        .trim()
        .email({ message: 'Invalid email address format.' })
        .nonempty({ message: 'Email is required.' }),
});
