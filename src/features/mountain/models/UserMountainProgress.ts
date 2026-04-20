import type { IUserMountainProgress } from '@mountain/interfaces/mountain.interface';
import { model, Schema } from 'mongoose';

const UserMountainProgressSchema = new Schema<IUserMountainProgress>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        contentId: {
            type: Schema.Types.ObjectId,
            ref: 'MountainContent',
            required: true,
            index: true,
        },
        colors: {
            type: Map,
            of: String,
            default: {},
        },
        lastReviewed: {
            type: Date,
        },
        reviewCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Ensure one progress record per user per content
UserMountainProgressSchema.index({ userId: 1, contentId: 1 }, { unique: true });

export const UserMountainProgress = model<IUserMountainProgress>(
    'UserMountainProgress',
    UserMountainProgressSchema
);
