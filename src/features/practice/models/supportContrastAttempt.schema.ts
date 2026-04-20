import { Schema, model } from 'mongoose';
import { ISupportContrastAttempt } from '../interfaces/supportContrast.interface';

const supportContrastAttemptSchema = new Schema<ISupportContrastAttempt>({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    support_contrast: {
        type: Schema.Types.ObjectId,
        ref: 'SupportContrast',
        required: true,
        index: true,
    },
    blank_index: { type: Number, required: true },
    reasoning_type: { type: String, enum: ['support', 'contrast'], required: true },
    associated_token: { type: String, required: true },
    correct: { type: Boolean, required: true },
    first: { type: Boolean, default: false },
    really_first: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
});

export const SupportContrastAttemptModel = model<ISupportContrastAttempt>(
    'SupportContrastAttempt',
    supportContrastAttemptSchema
);
