import * as z from 'zod';

export const thumbnailSizeSchema = z.enum(['3', '4', '6', '12']).transform(Number);
export const objectIdSchema = z.string().min(1, 'Invalid course ID');

export const courseSchema = z.object({
    title: z.string().min(1),
    slug: z.string().optional(),
    description: z.string().optional(),
    seriesId: objectIdSchema,
    order: z.number().int().nonnegative().default(0),
    thumbnailSize: thumbnailSizeSchema,
    img: z.string().url(),
    banner: z.string().optional().nullable(),
    groups: z.array(objectIdSchema).optional(),
    isActive: z.boolean().default(true),
});

export const updateCourseSchema = courseSchema.partial();

export type CourseInput = z.infer<typeof courseSchema>;
