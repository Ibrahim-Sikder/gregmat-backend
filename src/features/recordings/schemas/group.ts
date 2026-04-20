import * as z from 'zod';

export const thumbnailSizeSchema = z.enum(['3', '4', '6']).transform(Number);
export const objectIdSchema = z.string().min(1, 'Invalid class group ID');

export const classGroupSchema = z.object({
    title: z.string().min(1),
    slug: z.string().optional(),
    description: z.string().optional(),
    courseId: objectIdSchema,
    order: z.number().int().nonnegative().default(0),
    img: z.string().url().optional().nullable(),
    classes: z.array(objectIdSchema).optional(),
});

export type ClassGroupInput = z.infer<typeof classGroupSchema>;
