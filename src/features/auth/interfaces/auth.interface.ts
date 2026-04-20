import type { Document, Model } from 'mongoose';
import type { ObjectId } from 'mongodb';
import type { IUserDocument, UserRole } from '@user/interfaces/user.interface';

declare global {
    namespace Express {
        interface Request {
            currentUser?: AuthPayload;
        }
    }
}

export interface AuthPayload {
    userId: string;
    uId: string;
    email: string;
    username: string;
    role: UserRole;
    sessionId: string;
    provider: AuthProvider;
    iat?: number;
    isBlocked?: boolean;
}

export type AuthProvider = 'credentials' | 'google';

export interface IAuthDocument extends Document {
    _id: string | ObjectId;
    uId: string;
    email: string;
    username: string;
    password?: string;
    role: UserRole;
    provider: AuthProvider;
    providerId?: string;
    createdAt: Date;
    updatedAt: Date;

    // Email verification
    isEmailVerified?: boolean;
    emailVerificationToken?: string | null;
    emailVerificationExpires?: Date | null;
    passwordResetToken?: string | null;
    passwordResetExpires?: Date | null;

    // Security & session management
    isBlocked?: boolean;
    blockReason?: string;
    blockedUntil?: Date;
    failedLoginAttempts?: number;
    lastFailedLogin?: Date;
    suspiciousLoginAttempts?: number;
    lastSuspiciousLogin?: Date;
    currentSessionId?: string;
    lastLoginIP?: string;
    lastLoginDevice?: string;

    // Methods
    comparePassword: (candidatePassword: string) => Promise<boolean>;
    hashPassword: (password: string) => Promise<string>;
}

export interface IAuthModel extends Model<IAuthDocument> {
    findByEmailOrUsername: (email: string, username: string) => Promise<IAuthDocument | null>;
}

export interface IActiveSession {
    sessionId: string;
    userId: string;
    ip: string;
    userAgent: string;
    loginTime: Date;
    lastActivity: Date;
    provider: AuthProvider;
    deviceId?: string; // Device fingerprint for uniqueness
}

export interface ISignUpData {
    _id: ObjectId;
    uId: string;
    email: string;
    username: string;
    password: string;
    emailVerificationToken: string;
    emailVerificationExpires: Date;
}

export interface IAuthJob {
    value?: string | IAuthDocument | IUserDocument | IActiveSession | ISignUpData;
}
