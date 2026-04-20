import { z } from 'zod';

export const SentenceSchema = z.object({
    id: z.number().int().positive(),
    body: z.string().min(1, 'Sentence body is required'),
    order_in_paragraph: z.number().int().positive(),
    source: z.string().min(1, 'Source is required'),
    context: z.array(z.string()).optional().default([]),
});

export const SentenceSimplifyingPracticeSchema = z.object({
    title: z.string().min(1, 'Title is required').trim(),
    mode: z.enum(['paragraph', 'random']).default('paragraph'),
    user_generated: z.boolean().default(false),
    count: z.number().int().nonnegative().optional(),
    sentences: z.array(SentenceSchema).min(1, 'At least one sentence is required'),
});

export const SentenceAttemptSchema = z.object({
    sentence: z.number().int().positive('Sentence ID is required'),
    given_summary: z.string().min(1, 'Given summary is required'),
});

export const SentenceSimplifyingAttemptSchema = z.object({
    sentenceSimplifyingPractice: z.string().min(1, 'Sentence simplifying practice ID is required'),
    sentence_attempts: z
        .array(SentenceAttemptSchema)
        .min(1, 'At least one sentence attempt is required'),
});
