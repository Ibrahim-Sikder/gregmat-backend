import z from 'zod';

export const SectionSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required').optional(),
    img: z.string().url('Image must be a valid URL').nullable().optional(),
    img2: z.string().url('Second image must be a valid URL').nullable().optional(),
    studyPlan: z.string().min(1, 'Study Plan ID is required'),
    plusOnly: z.boolean().default(false),
    order: z.number().int('Order must be an integer').min(1, 'Order must be at least 1'),
});

export const updateSectionSchema = SectionSchema.partial();

export const SectionUpdateSchema = SectionSchema.partial();
