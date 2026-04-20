import type { IMountainContent } from '@mountain/interfaces/mountain.interface';
import { model, Schema } from 'mongoose';

const MountainContentSchema = new Schema<IMountainContent>(
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
        pronunciation: {
            type: String,
            trim: true,
        },
        tooltip: {
            type: String,
        },
        description: {
            type: String,
            required: true,
        },
        plusOnly: {
            type: Boolean,
            default: false,
        },
        finalized: {
            type: Boolean,
            default: false,
        },
        unlisted: {
            type: Boolean,
            default: false,
        },
        colors: {
            type: Map,
            of: String,
            default: {},
        },
        categoryId: {
            type: Schema.Types.ObjectId,
            ref: 'MountainCategory',
            required: true,
            index: true,
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

MountainContentSchema.index({ mountainId: 1, categoryId: 1, order: 1 });
MountainContentSchema.index({ slug: 1, mountainId: 1 }, { unique: true });

export const MountainContent = model<IMountainContent>('MountainContent', MountainContentSchema);
