import type { Model } from 'mongoose';
import { model, Schema } from 'mongoose';
import { SubscriptionType } from '@subscription/interfaces/subscription.interface';

export interface ISubscriptionPriceDocument {
    _id: string;
    type: SubscriptionType;
    price: number;
    updatedBy?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const subscriptionPriceSchema: Schema = new Schema<ISubscriptionPriceDocument>(
    {
        type: {
            type: String,
            enum: Object.values(SubscriptionType),
            required: true,
            unique: true,
        },
        price: { type: Number, required: true, min: 0 },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

const SubscriptionPriceModel: Model<ISubscriptionPriceDocument> = model<ISubscriptionPriceDocument>(
    'SubscriptionPrice',
    subscriptionPriceSchema,
    'SubscriptionPrice'
);

export default SubscriptionPriceModel;
