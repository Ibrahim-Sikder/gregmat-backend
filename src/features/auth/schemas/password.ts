import * as z from 'zod';

export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .trim()
        .email({ message: 'Invalid email address format.' })
        .nonempty({ message: 'Email is required.' }),
});

export const resetPasswordSchema = z
    .object({
        password: z
            .string()
            .min(6, { message: 'Password must be at least 6 characters long.' })
            .nonempty({ message: 'Password is required.' })
            .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
            .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
            .regex(/[^A-Za-z0-9]/, {
                message: 'Password must contain at least one special character.',
            }),

        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });
