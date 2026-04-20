import { Schema, model } from 'mongoose';
import type { MiscQuiz } from '../interfaces/misc.interfaces';

const MiscQuizSchema = new Schema<MiscQuiz>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        banner: { type: String },
        description: { type: String },
        plus_only: { type: Boolean, default: false },
        video: {
            url: { type: String, default: null },
            embed_code: { type: String },
            duration: { type: Number },
        },
    },
    {
        timestamps: true,
    }
);

export const MiscQuizModel = model<MiscQuiz>('MiscQuiz', MiscQuizSchema);
