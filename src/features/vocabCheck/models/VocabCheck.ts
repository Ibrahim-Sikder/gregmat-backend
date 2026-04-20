import { model, Schema, Types } from 'mongoose';
import type { IVocabCheck } from '../interfaces/vocabCheck.interface';

const VocabCheckSchema = new Schema<IVocabCheck>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        words: [
            {
                id: { type: Schema.Types.ObjectId, required: true },
                word: { type: String, required: true },
                definition: { type: String, required: true },
            },
        ],
        groups: [
            {
                id: { type: Schema.Types.ObjectId, required: true },
                number: { type: Number, required: true },
            },
        ],
        attempts: [
            {
                id: { type: Schema.Types.ObjectId, default: () => new Types.ObjectId() },
                created_at: { type: Date, default: Date.now },
                first: { type: Boolean, default: false },
                graded: { type: Boolean, default: false },
                score: { type: Number, default: 0 },
                word_attempts: [
                    {
                        id: { type: Schema.Types.ObjectId, default: () => new Types.ObjectId() },
                        word: { type: Schema.Types.ObjectId, required: true },
                        given_definition: { type: String, default: '' },
                        gpt_score: { type: Number, default: 0 },
                        gpt_comment: { type: String, default: '' },
                        reported: { type: Boolean, default: false },
                    },
                ],
            },
        ],
    },
    {
        timestamps: true,
    }
);

export const VocabCheck = model<IVocabCheck>('VocabCheck', VocabCheckSchema);
