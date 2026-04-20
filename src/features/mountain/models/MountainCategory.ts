import type { IMountainCategory } from '@mountain/interfaces/mountain.interface';
import { model, Schema } from 'mongoose';

const MountainCategorySchema = new Schema<IMountainCategory>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        description: {
            type: String,
        },
        mountainId: {
            type: Schema.Types.ObjectId,
            ref: 'Mountain',
            required: true,
            index: true,
        },
        order: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

MountainCategorySchema.index({ mountainId: 1, order: 1 });
MountainCategorySchema.index({ slug: 1, mountainId: 1 }, { unique: true });

export const MountainCategory = model<IMountainCategory>(
    'MountainCategory',
    MountainCategorySchema
);
