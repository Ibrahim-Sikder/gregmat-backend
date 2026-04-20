import { Schema, model } from 'mongoose';
import type { IStudyPlan } from '@studyPlan/interfaces/plan.interface';

const StudyPlanSchema = new Schema<IStudyPlan>(
    {
        title: { type: String, required: true },
        tagline: { type: String, required: true },
        description: { type: String, required: true },
        slug: { type: String, unique: true, required: true },
        img: String,
        img2: String,
        sections: [{ type: Schema.Types.ObjectId, ref: 'Section' }],
        plusOnly: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const StudyPlanModel = model<IStudyPlan>('StudyPlan', StudyPlanSchema, 'StudyPlan');

export default StudyPlanModel;
