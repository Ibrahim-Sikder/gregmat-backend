import { z } from 'zod';

export const videoSchema = z.object({
    url: z.string().nullable(),
    embed_code: z.string(),
    duration: z.number(),
});

export const miscQuizSchema = z.object({
    title: z.string(),
    slug: z.string(),
    banner: z.string().nullable(),
    description: z.string(),
    plus_only: z.boolean(),
    video: videoSchema.nullable(),
});
