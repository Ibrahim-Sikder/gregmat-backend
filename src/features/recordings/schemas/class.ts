import * as z from 'zod';

export const thumbnailSizeSchema = z.enum(['3', '4', '6', '12']).transform(Number);
export const objectIdSchema = z.string().min(1, 'Invalid class ID');

export const classTypeSchema = z.enum([
    'GRE-Quant',
    'GRE-Verbal',
    'GRE-Writing',
    'GRE-General',
    'TOEFL',
    'IELTS',
    'Misc',
    'Other',
]);

export const classSchema = z.object({
    title: z.string().min(1),
    slug: z.string().optional(),
    description: z.string().optional(),
    groupId: z.string().nullable(),
    order: z.number().int().nonnegative().default(0),
    classType: classTypeSchema,
    img: z.string().url().optional().nullable(),
    thumbnailSize: thumbnailSizeSchema,
    plusOnly: z.boolean().default(false),
    video: z.string().url().optional().nullable(),
    homeworks: z.string().default(''),
    resources: z.array(z.string().url()).default([]),
});

export type ClassInput = z.infer<typeof classSchema>;
