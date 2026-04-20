import mongoose, { type Model, Schema } from 'mongoose';
import type { IUserProblemAction } from '@practice/interfaces/problem.interface';

const userProblemActionSchema: Schema = new Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        problemId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Problem',
            required: true,
            index: true,
        },
        liked: { type: Boolean, default: false },
        disliked: { type: Boolean, default: false },
        bookmarked: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Compound unique index to ensure one action document per user-problem pair
userProblemActionSchema.index({ userId: 1, problemId: 1 }, { unique: true });

const UserProblemActionModel: Model<IUserProblemAction> = mongoose.model<IUserProblemAction>(
    'UserProblemAction',
    userProblemActionSchema
);

export { UserProblemActionModel };
