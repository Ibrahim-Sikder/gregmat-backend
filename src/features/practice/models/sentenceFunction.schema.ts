import mongoose, { type Model, Schema } from 'mongoose';
import type { ISentenceFunction } from '@practice/interfaces/sentenceFunction.interface';

const sentencePartSchema = new Schema(
    {
        id: { type: Number, required: true },
        order: { type: Number, required: true },
        content: { type: String, required: true },
        description: { type: String, default: '' },
        is_answer: { type: Boolean, default: false },
    },
    { _id: false }
);

const sentenceFunctionSchema: Schema = new Schema(
    {
        id: { type: Number }, // External ID
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        body: { type: String, required: true },
        source: { type: String, default: '' },
        sentence_parts: [sentencePartSchema],
        acceptance: { type: Number, default: 0 },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const SentenceFunctionModel: Model<ISentenceFunction> = mongoose.model<ISentenceFunction>(
    'SentenceFunction',
    sentenceFunctionSchema
);
export { SentenceFunctionModel };
