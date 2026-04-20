import { z } from 'zod';
import { Types } from 'mongoose';

export const PromptSchema = z.object({
    id: z.number().int().positive().optional(),
    body: z.string().min(1, 'Prompt body is required'),
    promptType: z.enum(['Issue', 'Argument']),
    accessType: z.enum(['Our Prompt', 'User Prompt']).optional(),
    userId: z.union([z.string(), z.instanceof(Types.ObjectId)]).optional(),
});

export type PromptDto = z.infer<typeof PromptSchema>;
