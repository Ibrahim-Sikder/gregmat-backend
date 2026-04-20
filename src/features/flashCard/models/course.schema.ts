import type { IFlashCardCourse } from '@flashCard/interfaces/flashCard.interface';
import { model, Schema } from 'mongoose';

// FlashCard Course Schema
const FlashCardCourseSchema = new Schema<IFlashCardCourse>(
    {
        title: { type: String, required: true },
        order: { type: Number, required: true },
        ongoing: { type: Boolean, default: false },
        thumbnail_size: { type: Number, required: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String },
        img: { type: String, default: null },
        banner: { type: String, default: null },
        classgroups: [{ type: Schema.Types.ObjectId, ref: 'FlashCardClassGroup' }],
    },
    { timestamps: true }
);

// Create indexes for better query performance
FlashCardCourseSchema.index({ slug: 1 });
FlashCardCourseSchema.index({ order: 1 });

// Create and export model
const FlashCardCourseModel = model<IFlashCardCourse>(
    'FlashCardCourse',
    FlashCardCourseSchema,
    'FlashCardCourse'
);

export default FlashCardCourseModel;
