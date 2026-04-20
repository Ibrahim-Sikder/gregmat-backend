import type { IAuthDocument, IAuthModel } from '@auth/interfaces/auth.interface';
import { UserRole } from '@user/interfaces/user.interface';
import { compare, hash } from 'bcryptjs';
import { model, Schema } from 'mongoose';

const SALT_ROUND = 12;

const authSchema = new Schema<IAuthDocument>(
    {
        uId: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
        },
        role: {
            type: String,
            enum: UserRole,
            default: UserRole.USER,
        },
        password: {
            type: String,
        },
        provider: {
            type: String,
            enum: ['credentials', 'google'],
            default: 'credentials',
            required: true,
        },
        providerId: {
            type: String,
            default: '',
        },

        isEmailVerified: {
            type: Boolean,
            default: false,
        },
        emailVerificationToken: {
            type: String,
            default: null,
        },
        emailVerificationExpires: {
            type: Date,
            default: null,
        },
        passwordResetToken: {
            type: String,
            default: null,
        },
        passwordResetExpires: {
            type: Date,
            default: null,
        },

        isBlocked: {
            type: Boolean,
            default: false,
        },
        blockReason: {
            type: String,
            default: null,
        },
        blockedUntil: {
            type: Date,
            default: null,
        },
        failedLoginAttempts: {
            type: Number,
            default: 0,
        },
        lastFailedLogin: {
            type: Date,
            default: null,
        },
        suspiciousLoginAttempts: {
            type: Number,
            default: 0,
        },
        lastSuspiciousLogin: {
            type: Date,
            default: null,
        },

        currentSessionId: {
            type: String,
            default: null,
        },
        lastLoginIP: {
            type: String,
            default: null,
        },
        lastLoginDevice: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: 'Auth',
    }
);

// Indexes for performance
authSchema.index({ provider: 1 });
authSchema.index({ isBlocked: 1 });
authSchema.index({ emailVerificationToken: 1 });
authSchema.index({ passwordResetToken: 1 });
authSchema.index({ currentSessionId: 1 });

authSchema.pre('save', async function (this: IAuthDocument, next: () => void) {
    if (!this.isModified('password')) {
        return next();
    }
    if (this.password && this.password.startsWith('$2b$')) {
        return next();
    }

    const hashedPassword = await hash(this.password as string, SALT_ROUND);
    this.password = hashedPassword;
    next();
});

authSchema.methods.hashPassword = async function (password: string): Promise<string> {
    return hash(password, SALT_ROUND);
};

authSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    try {
        const hashedPassword: string = (this as unknown as IAuthDocument).password!;
        const trimmedPassword = password.trim();
        const trimmedHash = hashedPassword.trim();
        const isMatch = await compare(trimmedPassword, trimmedHash);

        return isMatch;
    } catch (err) {
        return false;
    }
};

authSchema.statics.findByEmailOrUsername = function (email: string, username: string) {
    return this.findOne({
        $or: [{ email: email.toLowerCase() }, { username: username }],
    });
};

authSchema.methods.toJSON = function () {
    const authObject = this.toObject();
    delete authObject.password;
    delete authObject.emailVerificationToken;
    delete authObject.passwordResetToken;
    delete authObject.__v;
    return authObject;
};

const AuthModel = model<IAuthDocument, IAuthModel>('Auth', authSchema, 'Auth');

export default AuthModel;
