import { z } from 'zod';

// FlashCard Class Schema
export const FlashCardClassSchema = z.object({
    classGroupId: z.string().min(1, 'ClassGroup ID is required'),
    title: z.string().min(1, 'Title is required'),
    remarks_for_upcoming_page: z.string().nullable().optional(),
    description: z.string().min(1, 'Description is required'),
    img: z.string().url('Image must be a valid URL'),
    class_type: z.string().min(1, 'Class type is required'),
    plus_only: z.boolean().default(false),
    thumbnail_size: z.number().positive('Thumbnail size must be positive'),
});

export type FlashCardClass = z.infer<typeof FlashCardClassSchema>;
