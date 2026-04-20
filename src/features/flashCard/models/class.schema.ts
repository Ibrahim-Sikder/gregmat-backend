import type { IFlashCardClass } from '@flashCard/interfaces/flashCard.interface';
import { model, Schema } from 'mongoose';

const FlashCardClassSchema = new Schema<IFlashCardClass>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        remarks_for_upcoming_page: { type: String, default: null },
        description: { type: String, required: true },
        img: { type: String, required: true },
        class_type: { type: String, required: true },
        plus_only: { type: Boolean, default: false },
        thumbnail_size: { type: Number, required: true },
    },
    { timestamps: true }
);

// Create indexes for better query performance
FlashCardClassSchema.index({ slug: 1 });
FlashCardClassSchema.index({ session_number: 1 });
FlashCardClassSchema.index({ class_type: 1 });

// Create and export model
const FlashCardClassModel = model<IFlashCardClass>(
    'FlashCardClass',
    FlashCardClassSchema,
    'FlashCardClass'
);

export default FlashCardClassModel;
