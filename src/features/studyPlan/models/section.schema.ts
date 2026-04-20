import type { ISection } from '@studyPlan/interfaces/section.interface';
import { model, Schema } from 'mongoose';

const SectionSchema = new Schema<ISection>(
    {
        title: { type: String, required: true },
        description: String,
        slug: { type: String, required: true },
        img: String,
        img2: String,
        order: { type: Number, required: true },
        studyPlan: { type: Schema.Types.ObjectId, ref: 'StudyPlan', required: true },
        units: [{ type: Schema.Types.ObjectId, ref: 'Unit' }],
        plusOnly: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const SectionModel = model<ISection>('Section', SectionSchema);

export default SectionModel;
