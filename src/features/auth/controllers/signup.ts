import type { IAuthDocument, ISignUpData } from '@auth/interfaces/auth.interface';
import { signupSchema } from '@auth/schemas/signup';
import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import { config } from '@root/config';
import { authService } from '@service/db/auth.service';
import { verificationEmailTemplate } from '@emails/templates/email-verification/template';
import authQueue from '@service/queues/auth.queue';
import emailQueue from '@service/queues/email.queue';
import userQueue from '@service/queues/user.queue';
import userCache from '@service/redis/user.cache';
import { UserRole, type IUserDocument } from '@user/interfaces/user.interface';
import type Logger from 'bunyan';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';

const log: Logger = config.createLogger('signupController');

class SignUp {
    @CatchAsync()
    @ZodValidation(signupSchema)
    public async execute(req: Request, res: Response): Promise<any> {
        const { username, email, password } = req.body;

        const checkIfUserExists = await authService.getAuthUserByEmail(email);

        // Email
        const verificationToken = crypto.randomBytes(60).toString('hex');
        const verificationExpiry = new Date(Date.now() + 1000 * 60 * 60);

        const verificationUrl = `${config.CLIENT_URL}/verify-email?token=${verificationToken}&email=${email}`;
        const template: string = verificationEmailTemplate.generate(username, verificationUrl);

        if (checkIfUserExists && checkIfUserExists.isEmailVerified) {
            throw new BadRequestError('This username or email is already taken');
        }

        if (checkIfUserExists && !checkIfUserExists.isEmailVerified) {
            await authService.updateEmailVerificationToken(
                checkIfUserExists._id.toString(),
                verificationToken,
                verificationExpiry
            );
            emailQueue.addEmailJob('verificationEmail', {
                subject: `Account activation on ${config.APP_NAME}`,
                receiverEmail: email,
                template,
            });

            return res.status(HTTP_STATUS.OK).json({
                message: 'Email verification link has been resent',
            });
        }

        const authObjectId: ObjectId = new ObjectId();
        const userObjectId: ObjectId = new ObjectId();
        const uId = `${Helpers.generateRandomIntegers(12)}`;

        const authData: IAuthDocument = SignUp.prototype.signupData({
            _id: authObjectId,
            uId,
            email,
            password,
            username,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpiry,
        });

        const userDataForCache = SignUp.prototype.userData(authData, userObjectId);

        try {
            // Step 1: Save to cache first (fastest to rollback)
            await userCache.saveUserToCache(`${userObjectId}`, uId, userDataForCache);

            // Step 2: Add critical database operations to queues
            await Promise.all([
                authQueue.addAuthJob('addAuthUserToDB', { value: authData }),
                userQueue.addUserJob('addUserToDB', { value: userDataForCache }),
            ]);

            emailQueue.addEmailJob('verificationEmail', {
                subject: `Account activation on ${config.APP_NAME}`,
                receiverEmail: email,
                template,
            });

            res.status(HTTP_STATUS.CREATED).json({
                message:
                    'User created successfully. Please check your email to verify your account.',
                user: { ...userDataForCache, password: undefined },
                requiresEmailVerification: true,
            });
        } catch (error) {
            log.error('User registration failed:', error);
            await SignUp.prototype.cleanupOnFailure(userObjectId, uId);
            throw new BadRequestError('User registration failed');
        }
    }

    private signupData(data: ISignUpData): IAuthDocument {
        const {
            _id,
            uId,
            email,
            password,
            username,
            emailVerificationToken,
            emailVerificationExpires,
        } = data;

        return {
            _id,
            uId,
            email: Helpers.lowerCase(email),
            username: Helpers.firstLetterUppercase(username),
            password,
            provider: 'credentials',
            providerId: '',
            role: UserRole.USER,
            isEmailVerified: false,
            emailVerificationToken,
            emailVerificationExpires,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as IAuthDocument;
    }

    private async cleanupOnFailure(userObjectId: ObjectId, uId: string): Promise<void> {
        try {
            // Remove from cache
            await userCache.deleteUserFromCache(`${userObjectId}`, `${uId}`);

            // Add cleanup jobs to queues
            authQueue.addAuthJob('deleteAuthUserFromDB', { value: uId });
            userQueue.addUserJob('deleteUserFromDB', { value: userObjectId.toString() });
        } catch (cleanupError) {
            log.error('Cleanup failed:', cleanupError);
        }
    }

    public userData(data: IAuthDocument, userObjectId: ObjectId | string): IUserDocument {
        const { _id, uId, email, username, password, role, isEmailVerified } = data;

        return {
            _id: userObjectId,
            uId,
            auth: _id,
            email: Helpers.lowerCase(email),
            username: Helpers.firstLetterUppercase(username),
            role: role || UserRole.USER,
            profilePicture: '',
            isEmailVerified: isEmailVerified || false,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as IUserDocument;
    }
}

export default SignUp;
