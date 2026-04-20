import { z } from 'zod';

export const QuestionTypeEnum = z.enum([
    'quantitative_comparison',
    'multiple_choice',
    'multiple_select',
    'numeric_entry_fraction',
    'numeric_entry_not_fraction',
    'tc_1_blank',
    'tc_2_blank',
    'tc_3_blank',
    'reading_multiple_choice',
    'reading_select_all',
    'sentence_equivalence',
    'fill_in_the_blank',
    'true_false',
    'matching',
    'pairing',
]);

export const SuperCategoryEnum = z.enum(['Quant', 'Verbal', 'Vocab']);

export const ChoiceSchema = z.object({
    order: z.number(),
    title: z.string(),
    body: z.string(),
});

export const ChoiceGroupSchema = z.object({
    title: z.string(),
    choices: z.array(ChoiceSchema),
});

export const LeftSideTextSchema = z
    .object({
        title: z.string(),
        body: z.string(),
    })
    .nullable();

export const QuestionSchema = z.object({
    title: z.string(),
    short_meta: z.string().optional(),
    type: QuestionTypeEnum,
    body: z.string(),
    choice_groups: z.array(ChoiceGroupSchema).optional(),
    has_solution_video: z.boolean().optional(),
    note: z.string().optional(),
    can_watch: z.boolean().optional(),
    solution_video: z.string().optional(),
    answer: z.string(),
    max_score: z.number(),
    source: z.string().optional(),
    super_category: SuperCategoryEnum,
    solution_has_video: z.boolean().optional(),
    left_side_text: LeftSideTextSchema.optional(),
    order_in_quiz: z.number(),
    quiz: z.string().optional().nullable(),
});

export type Question = z.infer<typeof QuestionSchema>;
