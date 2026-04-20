import type { Document, ObjectId } from 'mongoose';

export enum SubscriptionType {
    GREGMAT = 'gregmat',
    GREGMAT_PREPSWIFT = 'gregmat_prepswift',
}

export enum SubscriptionStatus {
    ACTIVE = 'active',
    EXPIRED = 'expired',
    CANCELLED = 'cancelled',
}

export enum SubscriptionRequestStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

export interface ISubscriptionDocument extends Document {
    _id: string | ObjectId;
    user: string | ObjectId;
    type: SubscriptionType;
    status: SubscriptionStatus;
    price: number;
    startDate: Date;
    endDate: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ISubscriptionRequestDocument extends Document {
    _id: string | ObjectId;
    user: string | ObjectId;
    type: SubscriptionType;
    message?: string;
    status: SubscriptionRequestStatus;
    reviewedBy?: string | ObjectId; // Admin who reviewed it
    reviewedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
