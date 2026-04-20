import { z } from 'zod';

const VideoSchema = z.object({
    url: z.string().optional(),
    embed_code: z.string().optional().default(''),
    duration: z.number().min(0, 'Duration must be non-negative').default(0),
});

const MountainContentSchema = z.object({
    title: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
});

export const PrepswiftContentSchema = z.object({
    title: z.string().min(1, 'Content title is required'),
    slug: z.string().min(1, 'Content slug is required').optional(),
    description: z.string().optional().default(''),
    plus_only: z.boolean().optional().default(false),
    finalized: z.boolean().optional().default(false),
    unlisted: z.boolean().optional().default(false),
    video: VideoSchema,
    associated_mountain_content: MountainContentSchema.nullable().optional(),
    categoryId: z.string().min(1, 'Category ID is required'),
    courseId: z.string().min(1, 'Course ID is required'),
    order: z.number().min(0, 'Order must be non-negative').default(0),
});

export type PrepswiftContent = z.infer<typeof PrepswiftContentSchema>;
export type PrepswiftVideo = z.infer<typeof VideoSchema>;
