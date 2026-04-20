import { z } from 'zod';

export const PrepswiftCategorySchema = z.object({
    title: z.string().min(1, 'Category title is required'),
    slug: z.string().min(1, 'Category slug is required').optional(),
    description: z.string().optional().default(''),
    courseId: z.string().min(1, 'Course ID is required'),
});

export type PrepswiftCategory = z.infer<typeof PrepswiftCategorySchema>;
