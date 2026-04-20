import type { IQuiz, IRule, IRuleSet, ISection } from '@quiz/interfaces/quiz.interface';
import { model, Schema } from 'mongoose';

const RuleSchema = new Schema<IRule>(
    {
        left: { type: String, required: true },
        right: { type: String, required: true },
        operator: {
            type: String,
            enum: ['gte', 'lte', 'gt', 'lt', 'eq', 'ne'],
            required: true,
        },
    },
    { _id: false }
);

const RuleSetSchema = new Schema<IRuleSet>(
    {
        rules: { type: [RuleSchema], default: [] },
    },
    { _id: false }
);

const SectionSchema = new Schema<ISection>(
    {
        identifier: { type: Number, required: true },
        title: { type: String, required: true },
        section_type: { type: String, enum: ['Quant', 'Verbal'], required: true },
        start_index: { type: Number, required: true },
        end_index: { type: Number, required: true },
        minutes: { type: Number, required: true },
        rule: { type: RuleSetSchema, required: true },
        description: { type: String, required: true },
    },
    { _id: false }
);

const QuizSchema = new Schema<IQuiz>(
    {
        plus_only: { type: Boolean, default: false },
        img: { type: String },
        title: { type: String, required: true },
        body: { type: String, required: true },
        completion_body: { type: String },
        slug: { type: String, required: true, unique: true },
        minutes: { type: Number, required: true },
        questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
        super_category: { type: String, enum: ['Quant', 'Verbal'], required: true },
        // attempts: [{ type: Schema.Types.ObjectId, ref: 'Attempt' }],
        timing_mode: { type: String, enum: ['Time Sensitive', 'Untimed'], required: true },
        emotions: { type: [String], default: [] },
        is_shown_in_quizdata: { type: Boolean, default: true },
        is_multisection: { type: Boolean, default: false },
        visible_sections: { type: Number, default: 1 },
        scale_to_gre: { type: Boolean, default: false },
        scaling_formula: {
            type: Schema.Types.Mixed,
            required: function (this: IQuiz) {
                return this.scale_to_gre === true;
            },
        },
        begins_with_writing: { type: Boolean, default: false },
        writing_prompt: { type: String },
        sections: { type: [SectionSchema], default: [] },
        break_minutes: { type: Number, default: 0 },
        experimental: { type: Boolean, default: false },
        is_prepswift: { type: Boolean, default: false },
        associated_class: { type: String },
        associated_content: { type: String },
        attempts: [{ type: Schema.Types.ObjectId, ref: 'Attempt' }],
        solution: { type: String },
    },
    { timestamps: true }
);

const QuizModel = model<IQuiz>('Quiz', QuizSchema, 'Quiz');

export default QuizModel;
