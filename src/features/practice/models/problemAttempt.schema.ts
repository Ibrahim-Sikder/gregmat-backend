import mongoose, { type Model, Schema } from 'mongoose';
import type { IProblemAttempt } from '@practice/interfaces/problem.interface';

const problemAttemptSchema: Schema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        required: true,
        index: true,
    },

    isCorrect: { type: Boolean, default: false },
    attemptedAt: { type: Date, default: Date.now },
    answer: { type: mongoose.Schema.Types.Mixed },
    first: { type: Boolean, default: false },
});

// Compound index to quickly check if a user has attempted a problem
problemAttemptSchema.index({ userId: 1, problemId: 1 });

const ProblemAttemptModel: Model<IProblemAttempt> = mongoose.model<IProblemAttempt>(
    'ProblemAttempt',
    problemAttemptSchema
);
export { ProblemAttemptModel };
