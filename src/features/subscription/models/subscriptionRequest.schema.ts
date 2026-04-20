import type { ISubscriptionRequestDocument } from '@subscription/interfaces/subscription.interface';
import {
    SubscriptionRequestStatus,
    SubscriptionType,
} from '@subscription/interfaces/subscription.interface';
import type { Model } from 'mongoose';
import { model, Schema } from 'mongoose';

const subscriptionRequestSchema: Schema = new Schema<ISubscriptionRequestDocument>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        type: {
            type: String,
            enum: Object.values(SubscriptionType),
            required: true,
        },
        message: { type: String, maxlength: 1000 },
        status: {
            type: String,
            enum: Object.values(SubscriptionRequestStatus),
            default: SubscriptionRequestStatus.PENDING,
            index: true,
        },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date },
    },
    { timestamps: true }
);

// Index for finding pending requests
subscriptionRequestSchema.index({ status: 1, createdAt: -1 });

// Index for user's requests
subscriptionRequestSchema.index({ user: 1, status: 1 });

const SubscriptionRequestModel: Model<ISubscriptionRequestDocument> =
    model<ISubscriptionRequestDocument>(
        'SubscriptionRequest',
        subscriptionRequestSchema,
        'SubscriptionRequest'
    );

export default SubscriptionRequestModel;
