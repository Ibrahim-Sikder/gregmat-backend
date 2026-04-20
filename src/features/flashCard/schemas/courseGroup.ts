import { z } from 'zod';

export const FlashCardCourseGroupSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    order: z.number().min(0, 'Order must be non-negative'),
    slug: z.string().min(1, 'Slug is required').optional(),
    description: z.string().optional(),
    img: z.string().url('Image must be a valid URL').nullable().optional(),
    courses: z.array(z.string()).optional(),
});

export const addCourseToGroupSchema = z.object({
    courseId: z.string().min(1, 'Course ID is required'),
});

export type FlashCardCourseGroup = z.infer<typeof FlashCardCourseGroupSchema>;
