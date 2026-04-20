import * as z from 'zod';

// Mountain Content schemas
export const mountainContentSchema = z.object({
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
    pronunciation: z.string().trim().optional(),
    tooltip: z.string().optional(),
    description: z.string().min(1, { message: 'Description is required' }),
    plusOnly: z.boolean().optional().default(false),
    finalized: z.boolean().optional().default(false),
    unlisted: z.boolean().optional().default(false),
    colors: z.record(z.string(), z.string()).optional().default({}),
    categoryId: z.string().min(1, { message: 'Category ID is required' }),
    mountainId: z.string().min(1, { message: 'Mountain ID is required' }),
    order: z.number().int().min(0).optional().default(0),
});

export const updateMountainContentSchema = mountainContentSchema.partial();

export const updateColorsSchema = z.object({
    color: z.string().trim().min(1, { message: 'Color is required' }),
});

export type MountainContentInput = z.infer<typeof mountainContentSchema>;
export type UpdateMountainContentInput = z.infer<typeof updateMountainContentSchema>;
export type UpdateColorsInput = z.infer<typeof updateColorsSchema>;
