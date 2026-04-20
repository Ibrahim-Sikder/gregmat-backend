import * as z from 'zod';

export const objectIdSchema = z.string().min(1, 'Invalid series ID');

export const seriesSchema = z.object({
    title: z.string().min(1),
    slug: z.string().optional(),
    description: z.string().optional(),
    order: z.number().int().nonnegative().default(0),
    img: z.string().url().optional(),
    courses: z.array(objectIdSchema).optional(),
    isQuizSeries: z.boolean().optional(),
    isAdmissionSeries: z.boolean().optional(),
});

export type SeriesInput = z.infer<typeof seriesSchema>;
