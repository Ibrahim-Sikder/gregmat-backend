import { z } from 'zod';

export const SuperQuizSchema = z.object({
    questionId: z.string().min(1, 'Question ID is required'),
});

export const AddQuestionSchema = z.object({
    questionId: z.string().min(1, 'Question ID is required'),
});
