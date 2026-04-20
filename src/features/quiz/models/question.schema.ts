import type {
    IChoice,
    IChoiceGroup,
    ILeftSideText,
    IQuestion,
} from '@quiz/interfaces/question.interface';
import {
    IDifficulty,
    IStatus,
    ISuperCategory,
    QuestionType,
} from '@quiz/interfaces/question.interface';
import { model, Schema } from 'mongoose';

const ChoiceSchema = new Schema<IChoice>(
    {
        order: { type: Number, required: true },
        title: { type: String, required: true },
        body: { type: String, required: true },
    },
    { _id: false }
);

const ChoiceGroupSchema = new Schema<IChoiceGroup>(
    {
        title: { type: String, required: true },
        choices: { type: [ChoiceSchema], default: [] },
    },
    { _id: false }
);

const LeftSideTextSchema = new Schema<ILeftSideText>(
    {
        title: { type: String, required: true },
        body: { type: String, required: true },
    },
    { _id: false }
);

const QuestionSchema = new Schema<IQuestion>(
    {
        title: { type: String, required: true },
        short_meta: { type: String, default: '' },
        type: { type: String, enum: Object.values(QuestionType), required: true },
        body: { type: String, required: true },
        choice_groups: { type: [ChoiceGroupSchema], default: [] },
        slug: { type: String, required: true, unique: true },
        has_solution_video: { type: Boolean, default: false },
        note: { type: String, default: '' },
        can_watch: { type: Boolean, default: false },
        solution_video: { type: String },
        answer: { type: String },
        max_score: { type: Number, required: true },
        source: { type: String },
        super_category: { type: String, enum: Object.values(ISuperCategory), required: true },
        solution_has_video: { type: Boolean, default: false },
        left_side_text: { type: LeftSideTextSchema },
        order_in_quiz: { type: Number, required: true },
        quiz: { type: Schema.Types.ObjectId, ref: 'Quiz' },
        difficulty: { type: String, enum: Object.values(IDifficulty), required: true },
        status: { type: String, enum: Object.values(IStatus), default: IStatus.ToDo },
        bookmarked: { type: Boolean, default: false },
        liked: { type: Boolean, default: false },
        disliked: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const QuestionModel = model<IQuestion>('Question', QuestionSchema, 'Question');

export default QuestionModel;
