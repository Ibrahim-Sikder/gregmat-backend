import { forgotPasswordSchema, resetPasswordSchema } from '@auth/schemas/password';
import { resetPasswordConfirmationEmailTemplate } from '@emails/templates/reset-password/template';
import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import { BadRequestError } from '@global/helpers/error-handlers';
import { config } from '@root/config';
import { authService } from '@service/db/auth.service';
import { forgotPasswordEmailTemplate } from '@emails/templates/forgot-password/template';
import emailQueue from '@service/queues/email.queue';
import type { IResetPasswordParams } from '@user/interfaces/user.interface';
import crypto from 'crypto';
import HTTP_STATUS from 'http-status-codes';
import publicIP from 'ip';
import moment from 'moment';

class Password {
    @CatchAsync()
    @ZodValidation(forgotPasswordSchema)
    public async forgotPassword(req: any, res: any): Promise<void> {
        const { email } = req.body;
        const existingUser = await authService.getAuthUserByEmail(email);
        if (!existingUser) {
            throw new BadRequestError('This email is not registered');
        }

        const passwordResetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetExpires = new Date(Date.now() + 1000 * 60 * 10); // 10 minutes

        await authService.updatePasswordToken(
            `${existingUser._id!}`,
            passwordResetToken,
            passwordResetExpires
        );

        const resetLink = `${config.CLIENT_URL}/reset-password?token=${passwordResetToken}`;
        const template: string = forgotPasswordEmailTemplate.generate(
            existingUser.username!,
            resetLink
        );
        emailQueue.addEmailJob('forgotPasswordEmail', {
            template,
            receiverEmail: email,
            subject: `Reset your password ${config.APP_NAME}`,
        });
        res.status(HTTP_STATUS.OK).json({ message: 'Password reset email sent.' });
    }

    @CatchAsync()
    @ZodValidation(resetPasswordSchema)
    public async resetPassword(req: any, res: any): Promise<void> {
        const { password, confirmPassword } = req.body;
        const { token } = req.params;
        if (password !== confirmPassword) {
            throw new BadRequestError('Passwords do not match');
        }
        const existingUser = await authService.getAuthUserByPasswordToken(token);
        if (!existingUser) {
            throw new BadRequestError('Reset token has expired.');
        }

        existingUser.password = password;
        existingUser.passwordResetExpires = undefined;
        existingUser.passwordResetToken = undefined;
        await existingUser.save();

        const templateParams: IResetPasswordParams = {
            username: existingUser.username!,
            email: existingUser.email!,
            ipaddress: publicIP.address(),
            date: moment().format('DD//MM//YYYY HH:mm'),
        };

        const template: string = resetPasswordConfirmationEmailTemplate.generate(templateParams);
        emailQueue.addEmailJob('resetPasswordConfirmationEmail', {
            template,
            receiverEmail: existingUser.email!,
            subject: 'Password Reset Confirmation',
        });
        res.status(HTTP_STATUS.OK).json({ message: 'Password successfully updated.' });
    }
}

export default Password;
