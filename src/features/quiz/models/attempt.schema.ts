import type { IAttempt, IQuestionAttempt } from '@quiz/interfaces/attempt.interface';
import { model, Schema } from 'mongoose';

const QuestionAttemptSchema = new Schema<IQuestionAttempt>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        answered_at: { type: Date, required: true },
        given_answer: { type: String},
        correct: { type: Boolean, required: true },
        question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
        quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: false },
        collection: { type: Schema.Types.ObjectId, ref: 'QuizCollection', required: false },
        score: { type: Number, required: true },
        score_denom: { type: Number, required: true },
        seconds: { type: Number, required: true },
    },
    { _id: false }
);

const AttemptSchema = new Schema<IAttempt>(
    {
        created_at: { type: Date, default: new Date() },
        attempts: { type: [QuestionAttemptSchema], default: [] },
        given_essay: { type: String, default: '' },
    },
    { timestamps: true }
);

const AttemptModel = model<IAttempt>('Attempt', AttemptSchema, 'Attempt');

export default AttemptModel;
