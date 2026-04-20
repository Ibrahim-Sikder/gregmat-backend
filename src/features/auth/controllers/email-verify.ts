import { resendVerificationSchema } from '@auth/schemas/verification';
import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import { BadRequestError } from '@global/helpers/error-handlers';
import { config } from '@root/config';
import { authService } from '@service/db/auth.service';
import userService from '@service/db/user.service';
import { verificationEmailTemplate } from '@emails/templates/email-verification/template';
import emailQueue from '@service/queues/email.queue';
import userCache from '@service/redis/user.cache';
import crypto from 'crypto';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class EmailVerification {
    @CatchAsync()
    public async verifyEmail(req: Request, res: Response): Promise<void> {
        const { token } = req.query;

        if (!token || typeof token !== 'string') {
            throw new BadRequestError('Invalid verification token');
        }

        const authUser = await authService.getAuthUserByVerificationToken(token);

        if (!authUser) {
            throw new BadRequestError('Invalid or expired verification token');
        }

        if (authUser.isEmailVerified) {
            throw new BadRequestError('Email is already verified');
        }

        if (authUser.emailVerificationExpires! < new Date()) {
            throw new BadRequestError('Verification token has expired');
        }

        const user = await userService.getUserByAuthId(`${authUser._id}`);
        if (!user) {
            throw new BadRequestError('Something went wrong! Try again later.');
        }

        // Update user verification status
        await authService.updateAuthUser(`${authUser._id}`, {
            isEmailVerified: true,
            emailVerificationToken: null,
            emailVerificationExpires: null,
        });

        // update user isEmailVerified
        await userService.updateUser(`${user._id}`, {
            isEmailVerified: true,
        });

        // Update user cache
        await userCache.updateSingleUserItemInCache(`${user._id}`, 'isEmailVerified', true);

        res.status(HTTP_STATUS.OK).json({
            message: 'Email verified successfully! You can now log in.',
        });
    }

    @CatchAsync()
    @ZodValidation(resendVerificationSchema)
    public async resendVerification(req: Request, res: Response): Promise<void> {
        const { email } = req.body;

        const authUser = await authService.getAuthUserByEmail(email);

        if (!authUser) {
            throw new BadRequestError('This user does not exist');
        }

        if (authUser.isEmailVerified) {
            throw new BadRequestError('This email is already verified');
        }

        // Generate new verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpiry = new Date(Date.now() + 60 * 60 * 1000);

        await authService.updateAuthUser(`${authUser._id}`, {
            isEmailVerified: true,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpiry,
        });

        // Send verification email via queue
        const verificationUrl = `${config.CLIENT_URL}/verify-email?token=${verificationToken}`;
        const template: string = verificationEmailTemplate.generate(
            authUser.username,
            verificationUrl
        );

        emailQueue.addEmailJob('verificationEmail', {
            subject: `Account activation on ${config.APP_NAME}`,
            receiverEmail: email,
            template,
        });

        res.status(HTTP_STATUS.OK).json({
            message: 'Verification email sent successfully',
        });
    }
}

export default EmailVerification;
