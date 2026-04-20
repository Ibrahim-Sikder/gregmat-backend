import type { IMountain } from '@mountain/interfaces/mountain.interface';
import { model, Schema } from 'mongoose';

const MountainSchema = new Schema<IMountain>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        tagline: {
            type: String,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        description: {
            type: String,
        },
        mountainType: {
            type: String,
            enum: ['vocab', 'quant', 'toefl', 'im-overwhelmed-quant', 'other'] as const,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
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

export const Mountain = model<IMountain>('Mountain', MountainSchema);
