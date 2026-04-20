import * as z from 'zod';

// Mountain schemas
export const mountainSchema = z.object({
    title: z
        .string()
        .trim()
        .min(1, { message: 'Title is required' })
        .max(200, { message: 'Title must be less than 200 characters' }),
    slug: z
        .string()
        .trim()
        .min(1, { message: 'Slug is required' })
        .max(100, { message: 'Slug must be less than 100 characters' })
        .regex(/^[a-z0-9-]+$/, {
            message: 'Slug can only contain lowercase letters, numbers, and hyphens',
        }),
    description: z.string().trim().optional(),
    mountainType: z.enum(['vocab', 'quant', 'toefl', 'other'], {
        message: 'Mountain type must be one of: vocab, quant, toefl, other',
    }),
    isActive: z.boolean().optional().default(true),
    order: z.number().int().min(0).optional().default(0),
});

export const updateMountainSchema = mountainSchema.partial();

export type MountainInput = z.infer<typeof mountainSchema>;
export type UpdateMountainInput = z.infer<typeof updateMountainSchema>;
