import { z } from 'zod';

export const SentenceSchema = z.object({
    body: z.string().min(1, 'Sentence body is required'),
    order_in_paragraph: z.number().int().positive(),
    source: z.string().min(1, 'Source is required'),
    context: z.string().nullable().optional(),
});

export const ParagraphSchema = z.object({
    order_in_passage: z.number().int().positive(),
    body: z.string().min(1, 'Paragraph body is required'),
    sentences: z.array(SentenceSchema).optional().default([]),
    main_idea: z.string().min(1, 'Main idea is required'),
    passage_source: z.string().min(1, 'Passage source is required'),
    context: z.string().min(1, 'Context is required'),
});

export const MainIdeaPracticeSchema = z.object({
    title: z.string().min(1, 'Title is required').trim(),
    mode: z.enum(['paragraph', 'Passage']).default('paragraph'),
    user_generated: z.boolean().default(false),
    paragraphs: z.array(ParagraphSchema).min(1, 'At least one paragraph is required'),
});

export const ParagraphAttemptSchema = z.object({
    paragraph: z.string().min(1, 'Paragraph ID is required'),
    given_main_idea: z.string().min(1, 'Given main idea is required'),
});

export const MainIdeaAttemptSchema = z.object({
    mainIdeaPractice: z.string().min(1, 'Main idea practice ID is required'),
    paragraph_attempts: z
        .array(ParagraphAttemptSchema)
        .min(1, 'At least one paragraph attempt is required'),
});
