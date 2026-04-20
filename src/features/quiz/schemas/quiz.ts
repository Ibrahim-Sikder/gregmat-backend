import { z } from 'zod';

export const SuperCategoryEnum = z.enum(['Quant', 'Verbal']);

export const RuleSchema = z.object({
    left: z.string(),
    right: z.string(),
    operator: z.enum(['gte', 'lte', 'gt', 'lt', 'eq', 'ne']),
});

export const RuleSetSchema = z.object({
    rules: z.array(RuleSchema),
});

export const SectionSchema = z.object({
    identifier: z.number(),
    title: z.string(),
    section_type: SuperCategoryEnum,
    start_index: z.number(),
    end_index: z.number(),
    minutes: z.number(),
    rule: RuleSetSchema,
    description: z.string(),
});

export const QuizSchema = z.object({
    plus_only: z.boolean().optional(),
    img: z.string().optional(),
    title: z.string(),
    body: z.string(),
    completion_body: z.string().optional(),
    minutes: z.number(),
    questions: z.array(z.string()).optional(),
    super_category: SuperCategoryEnum,
    attempts: z.array(z.string()).optional(),
    timing_mode: z.enum(['Time Sensitive', 'Untimed']),
    emotions: z.array(z.string()).optional(),
    is_shown_in_quizdata: z.boolean().optional(),
    is_multisection: z.boolean().optional(),
    visible_sections: z.number().optional(),
    scale_to_gre: z.boolean().optional(),
    // scaling_formula: z.record(z.any(), z.any()).optional(),
    begins_with_writing: z.boolean().optional(),
    writing_prompt: z.string().optional(),
    sections: z.array(SectionSchema).optional(),
    break_minutes: z.number().optional(),
    experimental: z.boolean().optional(),
    is_prepswift: z.boolean().optional(),
    associated_class: z.string().optional(),
    associated_content: z.string().optional(),
    solution: z.string().optional(),
});

export type Quiz = z.infer<typeof QuizSchema>;
