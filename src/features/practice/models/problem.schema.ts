import mongoose, { type Model, Schema } from 'mongoose';
import type { IProblem } from '@practice/interfaces/problem.interface';

const choiceSchema = new Schema(
    {
        order: { type: Number, default: 0 },
        title: { type: String, required: true },
        body: { type: String, required: true },
    },
    { _id: false }
);

const choiceGroupSchema = new Schema(
    {
        title: { type: String, default: 'Title' },
        choices: [choiceSchema],
    },
    { _id: false }
);

const leftSideTextSchema = new Schema(
    {
        title: { type: String, default: '' },
        body: { type: String, default: '' },
    },
    { _id: false }
);

const problemSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        type: { type: String, required: true },
        difficulty: { type: String, required: true, index: true },
        super_category: { type: String, required: true, index: true },
        is_plus_only: { type: Boolean, default: true },
        acceptance_rate: { type: Number, default: 0 },
        slug: { type: String, required: true, unique: true },
        browser_title: { type: String },
        likes: { type: Number, default: 0 },
        has_solution_video: { type: Boolean, default: false },
        first_tlc: { type: String, default: null },
        tag: { type: String, required: false },
        listed_at: { type: Date, default: Date.now }, // When problem was published/listed

        // Detailed fields
        short_meta: { type: String, default: '' },
        body: { type: String, default: '' },
        answer: { type: String, default: '' },
        choice_groups: [choiceGroupSchema],
        can_watch: { type: Boolean, default: false },
        solution_video: { type: String, default: null },
        solution_has_video: { type: Boolean, default: false },
        max_score: { type: Number, default: 1 },
        source: { type: String, default: null },
        note: { type: String, default: '' }, // Solution Explanation
        left_side_text: { type: leftSideTextSchema, default: null },
        created_at: { type: Date, default: Date.now },
        order_in_quiz: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const ProblemModel: Model<IProblem> = mongoose.model<IProblem>('Problem', problemSchema);
export { ProblemModel };
