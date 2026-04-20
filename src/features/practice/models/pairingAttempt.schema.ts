import mongoose, { type Model, Schema } from 'mongoose';
import type { IPairingAttempt } from '@practice/interfaces/pairing.interface';

const pairAttemptItemSchema = new Schema(
    {
        first_word: { type: String, required: true },
        second_word: { type: String, default: '' },
    },
    { _id: false }
);

const pairingAttemptSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    pairing: { type: Schema.Types.ObjectId, ref: 'Pairing', required: true, index: true },
    score: { type: Number, default: 0 },
    correct: { type: Boolean, default: false },
    first: { type: Boolean, default: false },
    really_first: { type: Boolean, default: false },
    attempt: [pairAttemptItemSchema],
    created_at: { type: Date, default: Date.now },
});

const PairingAttemptModel: Model<IPairingAttempt> = mongoose.model<IPairingAttempt>(
    'PairingAttempt',
    pairingAttemptSchema
);
export { PairingAttemptModel };
