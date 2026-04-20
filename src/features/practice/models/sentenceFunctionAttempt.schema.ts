import mongoose, { type Model, Schema } from 'mongoose';
import type { ISentenceFunctionAttempt } from '@practice/interfaces/sentenceFunction.interface';

const sentenceFunctionAttemptSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sentence_function: {
        type: Schema.Types.ObjectId,
        ref: 'SentenceFunction',
        required: true,
        index: true,
    },
    selected_sentence_part: { type: Number, required: true },
    correct: { type: Boolean, default: false },
    first: { type: Boolean, default: false },
    really_first: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
});

const SentenceFunctionAttemptModel: Model<ISentenceFunctionAttempt> =
    mongoose.model<ISentenceFunctionAttempt>(
        'SentenceFunctionAttempt',
        sentenceFunctionAttemptSchema
    );
export { SentenceFunctionAttemptModel };
