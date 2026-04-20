import * as z from 'zod';

// Mountain Category schemas
export const mountainCategorySchema = z.object({
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
    mountainId: z.string().min(1, { message: 'Mountain ID is required' }),
    order: z.number().int().min(0).optional().default(0),
});

export const updateMountainCategorySchema = mountainCategorySchema.partial();

export type MountainCategoryInput = z.infer<typeof mountainCategorySchema>;
export type UpdateMountainCategoryInput = z.infer<typeof updateMountainCategorySchema>;
