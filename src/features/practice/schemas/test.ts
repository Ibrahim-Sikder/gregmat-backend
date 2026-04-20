import { z } from 'zod';
import { Types } from 'mongoose';

export const TestSchema = z.object({
    _id: z.union([z.string(), z.instanceof(Types.ObjectId)]).optional(),
    title: z.string().min(1, 'Title is required'),
    tagline: z.string().min(1, 'Tagline is required'),
    slug: z.string().optional(),
    description: z.string().optional(),
});

export type TestDto = z.infer<typeof TestSchema>;
