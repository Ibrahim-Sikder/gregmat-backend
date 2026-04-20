import type { ISentenceSimplifyingAttempt } from '@practice/interfaces/sentenceSimplifying.interface';
import mongoose, { Schema } from 'mongoose';

const SentenceAttemptSchema = new Schema(
    {
        sentence: {
            type: Number,
            required: true,
        },
        given_summary: {
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

const SentenceSimplifyingAttemptSchema = new Schema<ISentenceSimplifyingAttempt>(
    {
        sentenceSimplifyingPractice: {
            type: Schema.Types.ObjectId,
            ref: 'SentenceSimplifyingPractice',
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
        sentence_attempts: {
            type: [SentenceAttemptSchema],
            default: [],
        },
    },
    { timestamps: true }
);

SentenceSimplifyingAttemptSchema.index({ sentenceSimplifyingPractice: 1, user: 1 });

const SentenceSimplifyingAttemptModel = mongoose.model<ISentenceSimplifyingAttempt>(
    'SentenceSimplifyingAttempt',
    SentenceSimplifyingAttemptSchema
);

export default SentenceSimplifyingAttemptModel;
