import { z } from 'zod';

export const QuestionAttemptSchema = z.object({
    user: z.string().optional(),
    answered_at: z.date().or(z.string()).optional(),
    given_answer: z.string().optional(),
    correct: z.boolean().optional(),
    question: z.string().optional(),
    quiz: z.string().optional().optional(),
    collection: z.string().optional(),
    score: z.number().optional(),
    score_denom: z.number().optional(),
    seconds: z.number().optional(),
});

export const AttemptSchema = z.object({
    created_at: z.date().or(z.string()).optional(),
    attempts: z.array(QuestionAttemptSchema),
    given_essay: z.string().default(''),
});

export type QuestionAttempt = z.infer<typeof QuestionAttemptSchema>;
export type Attempt = z.infer<typeof AttemptSchema>;
