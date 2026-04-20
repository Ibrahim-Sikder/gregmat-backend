import * as z from 'zod';

export const signupSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, { message: 'Username must be at least 3 characters long.' })
        .max(20, { message: 'Username cannot exceed 20 characters.' })
        .nonempty({ message: 'Username is required.' }),
    email: z
        .string()
        .trim()
        .email({ message: 'Invalid email address format.' })
        .nonempty({ message: 'Email is required.' }),
    password: z
        .string()
        .min(6, { message: 'Password must be at least 6 characters long.' })
        .nonempty({ message: 'Password is required.' })
        .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
        .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
        .regex(/[^A-Za-z0-9]/, {
            message: 'Password must contain at least one special character.',
        }),
});

export type SignupInput = z.infer<typeof signupSchema>;
