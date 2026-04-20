import { Schema, model } from 'mongoose';
import { ISupportContrast, ISupportContrastBlank } from '../interfaces/supportContrast.interface';

const blankSchema = new Schema<ISupportContrastBlank>({
    id: { type: Number, required: true },
    blank_index: { type: Number, required: true },
    reasoning_type: { type: String, enum: ['support', 'contrast'], required: true },
    acceptable_tokens: { type: String, required: true },
});

const supportContrastSchema = new Schema<ISupportContrast>(
    {
        id: { type: Number },
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        text: { type: String, required: true },
        blanks: [blankSchema],
        acceptance: { type: Number, default: 0 },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

export const SupportContrastModel = model<ISupportContrast>(
    'SupportContrast',
    supportContrastSchema
);
