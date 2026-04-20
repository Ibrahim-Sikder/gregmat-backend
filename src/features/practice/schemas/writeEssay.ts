import { z } from 'zod';

export const WriteEssaySchema = z.object({
    promptId: z.string().optional().nullable(),
    promptBody: z.string().min(1).optional().nullable(),
    essayContent: z.string().min(1, 'Essay content is required'),
});

export type WriteEssayDto = z.infer<typeof WriteEssaySchema>;
