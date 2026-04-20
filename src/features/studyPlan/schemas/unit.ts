import { z } from 'zod';

export const UnitZodSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    description: z.string().optional(),
    order: z.number().optional(),
    plusOnly: z.boolean().default(false),
    twoSided: z.boolean().default(false),
    leftSideTitle: z.string().optional(),
    leftSide: z.string().optional(),
    rightSideTitle: z.string().optional(),
    rightSide: z.string().optional(),
    section: z.string().min(1, 'Section ID is required'),
});

export const UnitUpdateZodSchema = UnitZodSchema.partial();

export type UnitInput = z.infer<typeof UnitZodSchema>;
