import { z } from 'zod';

export const StudyPlanZodSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    tagline: z.string().min(1, 'Tagline is required'),
    description: z.string().min(1, 'Description is required'),
    img: z.string().url().optional(),
    img2: z.string().url().optional(),
    plusOnly: z.boolean().default(false),
});

export const StudyPlanUpdateZodSchema = StudyPlanZodSchema.partial();

export type StudyPlanInput = z.infer<typeof StudyPlanZodSchema>;
