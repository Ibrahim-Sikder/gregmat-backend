import type { IMainIdeaAttempt } from '@practice/interfaces/main-idea.interface';
import mongoose, { Schema } from 'mongoose';

const ParagraphAttemptSchema = new Schema(
    {
        paragraph: {
            type: Schema.Types.ObjectId,
            ref: 'Paragraph',
            required: true,
        },
        given_main_idea: {
            type: String,
            required: true,
        },
        reported: {
            type: Boolean,
            default: false,
        },
        gpt_score: {
            type: Number,
            required: false,
            min: 1,
            max: 5,
            default: null,
        },
        gpt_comment: {
            type: String,
            required: false,
            default: 'Grading in progress...',
        },
    },
    { _id: false }
);

const MainIdeaAttemptSchema = new Schema<IMainIdeaAttempt>(
    {
        mainIdeaPractice: {
            type: Schema.Types.ObjectId,
            ref: 'MainIdeaPractice',
            required: true,
            index: true,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        graded: {
            type: Boolean,
            default: false,
        },
        score: {
            type: Number,
            default: 0,
        },
        paragraph_attempts: {
            type: [ParagraphAttemptSchema],
            default: [],
        },
    },
    { timestamps: true }
);

MainIdeaAttemptSchema.index({ mainIdeaPractice: 1, user: 1 });

const MainIdeaAttemptModel = mongoose.model<IMainIdeaAttempt>(
    'MainIdeaAttempt',
    MainIdeaAttemptSchema
);

export default MainIdeaAttemptModel;
