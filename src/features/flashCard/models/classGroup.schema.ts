import type { IFlashCardClassGroup } from '@flashCard/interfaces/flashCard.interface';
import { model, Schema } from 'mongoose';

// FlashCard Class Group Schema
const FlashCardClassGroupSchema = new Schema<IFlashCardClassGroup>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        order: { type: Number, required: true },
        img: { type: String, default: null },
        classes: [{ type: Schema.Types.ObjectId, ref: 'FlashCardClass' }],
    },
    { timestamps: true }
);

// Create indexes for better query performance
FlashCardClassGroupSchema.index({ slug: 1 });
FlashCardClassGroupSchema.index({ order: 1 });

// Create and export model
const FlashCardClassGroupModel = model<IFlashCardClassGroup>(
    'FlashCardClassGroup',
    FlashCardClassGroupSchema,
    'FlashCardClassGroup'
);

export default FlashCardClassGroupModel;
