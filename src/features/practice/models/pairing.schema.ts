import mongoose, { type Model, Schema } from 'mongoose';
import type { IPairing } from '@practice/interfaces/pairing.interface';

const pairSchema = new Schema(
    {
        first_word: { type: String, required: true },
        second_word: { type: String, default: '' },
    },
    { _id: false }
);

const pairingSchema: Schema = new Schema(
    {
        id: { type: Number }, // External ID
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true, index: true },
        body: { type: String, default: '' },
        pairs: [pairSchema],
        acceptance: { type: Number, default: 0 },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const PairingModel: Model<IPairing> = mongoose.model<IPairing>('Pairing', pairingSchema);
export { PairingModel };
