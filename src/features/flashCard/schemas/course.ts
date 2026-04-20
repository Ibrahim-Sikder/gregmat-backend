import { z } from 'zod';

export const FlashCardCourseSchema = z.object({
    courseGroupId: z.string().min(1, 'Course group ID is required'),
    title: z.string().min(1, 'Title is required'),
    order: z.number().min(0, 'Order must be non-negative'),
    ongoing: z.boolean().default(false),
    thumbnail_size: z.number().positive('Thumbnail size must be positive'),
    slug: z.string().min(1, 'Slug is required').optional(),
    description: z.string().optional(),
    img: z.string().url('Image must be a valid URL').nullable().optional(),
    banner: z.string().url('Banner must be a valid URL').nullable().optional(),
    classgroups: z.array(z.string()).optional(),
});

export type FlashCardCourse = z.infer<typeof FlashCardCourseSchema>;
