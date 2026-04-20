import { z } from 'zod';

export const PrepswiftCourseSchema = z.object({
    title: z.string().min(1, 'Course title is required'),
    slug: z.string().min(1, 'Course slug is required').optional(),
    description: z.string().optional().default(''),
    is_prepswift: z.boolean().optional().default(false),
});

export type PrepswiftCourse = z.infer<typeof PrepswiftCourseSchema>;
