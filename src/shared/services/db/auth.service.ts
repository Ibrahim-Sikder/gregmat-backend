import type { IAuthDocument } from '@auth/interfaces/auth.interface';
import AuthModel from '@auth/models/auth.schema';
import { Helpers } from '@global/helpers/helpers';
import { ObjectId } from 'mongodb';

class AuthService {
    private model = AuthModel;

    public async createAuthUser(data: IAuthDocument): Promise<IAuthDocument> {
        const result = await this.model.create(data);
        return result;
    }

    public async getAuthUserByUsernameOrEmail(
        username: string,
        email: string
    ): Promise<IAuthDocument | null> {
        const user = await this.model.findByEmailOrUsername(
            Helpers.lowerCase(email),
            Helpers.firstLetterUppercase(username)
        );
        return user;
    }

    public async getAuthUserByUsername(username: string): Promise<IAuthDocument | null> {
        const user: IAuthDocument | null = await this.model
            .findOne({
                username: Helpers.firstLetterUppercase(username),
            })
            .exec();
        return user;
    }

    public async getAuthUserByEmail(email: string): Promise<IAuthDocument | null> {
        const user: IAuthDocument | null = await this.model
            .findOne({
                email: Helpers.lowerCase(email),
            })
            .exec();

        return user;
    }

    public async getAuthUserByPasswordToken(token: string): Promise<IAuthDocument | null> {
        const user: IAuthDocument | null = await this.model
            .findOne({
                passwordResetToken: token,
                passwordResetExpires: { $gt: Date.now() },
            })
            .exec();
        return user;
    }

    public async getAuthUserByVerificationToken(token: string): Promise<IAuthDocument | null> {
        const user: IAuthDocument | null = await this.model
            .findOne({
                emailVerificationToken: token,
                emailVerificationExpires: { $gt: Date.now() },
            })
            .exec();
        return user;
    }

    public async deleteAuthUserByUId(uId: string): Promise<void | null> {
        await this.model.deleteOne({ uId }).exec();
        return null;
    }

    public async updatePasswordToken(
        authId: string,
        token: string,
        tokenExpiration: Date
    ): Promise<void> {
        await this.model
            .updateOne(
                { _id: authId },
                {
                    passwordResetToken: token,
                    passwordResetExpires: tokenExpiration,
                }
            )
            .exec();
    }

    public async updateEmailVerificationToken(
        authId: string,
        token: string,
        tokenExpiration: Date
    ): Promise<void> {
        await this.model
            .updateOne(
                { _id: authId },
                {
                    emailVerificationToken: token,
                    emailVerificationExpires: tokenExpiration,
                }
            )
            .exec();
    }

    public async updateAuthUser(authId: string, data: Partial<IAuthDocument>): Promise<void> {
        const updateData: any = {};

        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined) {
                // Handle null values properly for clearing fields
                if (value === null) {
                    updateData[key] = null;
                } else {
                    updateData[key] = value;
                }
            }
        });

        // Use $unset for fields that should be completely removed
        const unsetData: any = {};
        if (data.lastFailedLogin === undefined && 'lastFailedLogin' in data) {
            unsetData.lastFailedLogin = '';
        }
        if (data.blockReason === undefined && 'blockReason' in data) {
            unsetData.blockReason = '';
        }
        if (data.blockedUntil === undefined && 'blockedUntil' in data) {
            unsetData.blockedUntil = '';
        }
        if (data.currentSessionId === undefined && 'currentSessionId' in data) {
            unsetData.currentSessionId = '';
        }
        if (data.lastSuspiciousLogin === undefined && 'lastSuspiciousLogin' in data) {
            unsetData.lastSuspiciousLogin = '';
        }

        const updateQuery: any = {};
        if (Object.keys(updateData).length > 0) {
            updateQuery.$set = updateData;
        }
        if (Object.keys(unsetData).length > 0) {
            updateQuery.$unset = unsetData;
        }

        await this.model.updateOne({ _id: new ObjectId(authId) }, updateQuery).exec();
    }

    // Additional helper method to get auth user by ID
    public async getAuthUserById(authId: string): Promise<IAuthDocument | null> {
        const user: IAuthDocument | null = await this.model.findById(authId).exec();

        return user;
    }

    // Method to validate auth user exists before operations
    public async validateAuthUserExists(authId: string): Promise<boolean> {
        const count = await this.model.countDocuments({ _id: authId }).exec();
        return count > 0;
    }

    public async unblockExpiredUsers(): Promise<void> {
        const now = new Date();
        await this.model
            .updateMany(
                {
                    isBlocked: true,
                    blockedUntil: { $lt: now },
                },
                {
                    $set: {
                        isBlocked: false,
                        failedLoginAttempts: 0,
                        suspiciousLoginAttempts: 0,
                    },
                    $unset: {
                        blockReason: '',
                        blockedUntil: '',
                        lastFailedLogin: '',
                        lastSuspiciousLogin: '',
                    },
                }
            )
            .exec();
    }

    public async deleteUnverifiedUsers(): Promise<void> {
        const now = new Date();
        await this.model
            .deleteMany({
                isEmailVerified: false,
                emailVerificationExpires: { $lt: now },
            })
            .exec();
    }
}

export const authService: AuthService = new AuthService();
