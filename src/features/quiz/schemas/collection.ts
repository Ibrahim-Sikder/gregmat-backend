import { z } from 'zod';

export const QuizReferenceSchema = z.object({
    quiz: z.string(),
    order_in_group: z.number().int().min(0).default(0),
});

export const QuizGroupSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    img: z.string().nullable().optional(),
    slug: z.string().optional(),
    body: z.string().optional(),
    quizzes: z.array(QuizReferenceSchema).optional().default([]),
    access: z.string().optional(),
    website: z.string().optional(),
});

export const QuizGroupUpdateSchema = QuizGroupSchema.partial();

export const QuizCollectionSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    tagline: z.string().optional(),
    slug: z.string().optional(),
    img: z.string().nullable().optional(),
    body: z.string().min(1, 'Body is required'),
    quiz_groups: z.array(QuizGroupSchema).optional().default([]),
    website: z.string().optional(),
});

export const QuizCollectionUpdateSchema = QuizCollectionSchema.partial();

export type QuizGroupInput = z.infer<typeof QuizGroupSchema>;
export type QuizGroupUpdateInput = z.infer<typeof QuizGroupUpdateSchema>;
export type QuizCollectionInput = z.infer<typeof QuizCollectionSchema>;
export type QuizCollectionUpdateInput = z.infer<typeof QuizCollectionUpdateSchema>;
