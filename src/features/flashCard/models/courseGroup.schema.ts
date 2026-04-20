import type { IFlashCardCourseGroup } from '@flashCard/interfaces/flashCard.interface';
import { model, Schema } from 'mongoose';

const FlashCardCourseGroupSchema = new Schema<IFlashCardCourseGroup>(
    {
        title: { type: String, required: true },
        order: { type: Number, required: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String, required: false },
        img: { type: String, default: null },
        courses: [{ type: Schema.Types.ObjectId, ref: 'FlashCardCourse' }],
    },
    { timestamps: true }
);

FlashCardCourseGroupSchema.index({ slug: 1 });
FlashCardCourseGroupSchema.index({ order: 1 });

// Create and export model
const FlashCardCourseGroupModel = model<IFlashCardCourseGroup>(
    'FlashCardCourseGroup',
    FlashCardCourseGroupSchema,
    'FlashCardCourseGroup'
);

export default FlashCardCourseGroupModel;
