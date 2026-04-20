import type { ISubscriptionDocument } from '@subscription/interfaces/subscription.interface';
import {
    SubscriptionStatus,
    SubscriptionType,
} from '@subscription/interfaces/subscription.interface';
import type { Model } from 'mongoose';
import { model, Schema } from 'mongoose';

const subscriptionSchema: Schema = new Schema<ISubscriptionDocument>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: {
            type: String,
            enum: Object.values(SubscriptionType),
            required: true,
        },
        status: {
            type: String,
            enum: Object.values(SubscriptionStatus),
            default: SubscriptionStatus.ACTIVE,
            index: true,
        },
        price: { type: Number, required: true, min: 0 },
        startDate: { type: Date, required: true, default: Date.now },
        endDate: { type: Date, required: true },
    },
    { timestamps: true }
);

// Compound index for active subscriptions by user
subscriptionSchema.index({ user: 1, status: 1 });

// Index for finding subscriptions that need renewal
subscriptionSchema.index({ status: 1, endDate: 1 });

const SubscriptionModel: Model<ISubscriptionDocument> = model<ISubscriptionDocument>(
    'Subscription',
    subscriptionSchema,
    'Subscription'
);

export default SubscriptionModel;
