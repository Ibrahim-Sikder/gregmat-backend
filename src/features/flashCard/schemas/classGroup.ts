import { z } from 'zod';

export const FlashCardClassGroupSchema = z.object({
    courseId: z.string().min(1, 'Course ID is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    order: z.number().min(0, 'Order must be non-negative'),
    img: z.string().url('Image must be a valid URL').nullable().optional(),
    classes: z.array(z.string()).optional(), // Array of ObjectIds as strings
});

export type FlashCardClassGroup = z.infer<typeof FlashCardClassGroupSchema>;
