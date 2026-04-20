import type { ISubscriptionDocument } from '@subscription/interfaces/subscription.interface';
import type { IAuthDocument } from '@auth/interfaces/auth.interface';

import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
}

export interface IUserDocument extends Document {
    _id: string | ObjectId;
    auth: string | ObjectId | IAuthDocument;
    username?: string;
    email?: string;
    password?: string;
    uId?: string;
    role: UserRole;
    profilePicture?: string;
    isEmailVerified: boolean;
    subscription?: ISubscriptionDocument | null;
    createdAt?: Date;

    updatedAt?: Date;
}

export interface IResetPasswordParams {
    username: string;
    email: string;
    ipaddress: string;
    date: string;
}

export interface ILogin {
    userId: string;
}

export interface IEmailJob {
    receiverEmail: string;
    template: string;
    subject: string;
}

export interface IUserJob {
    value?: string | IUserDocument;
}

export interface IAllUsers {
    users: IUserDocument[];
    totalUsers: number;
}
