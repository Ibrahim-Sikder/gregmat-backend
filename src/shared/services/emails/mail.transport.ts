import crypto from 'crypto';
import { stripHtml } from 'string-strip-html';
import nodemailer, { type SendMailOptions } from 'nodemailer';
import type Mail from 'nodemailer/lib/mailer';
import type Logger from 'bunyan';
import { config } from '@root/config';
import { BadRequestError } from '@global/helpers/error-handlers';

const log: Logger = config.createLogger('mailOptions');

class MailTransport {
    private createTransporter(): Mail {
        return nodemailer.createTransport({
            host: 'smtp.resend.com',
            port: 465,
            secure: true,
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            auth: {
                user: 'resend',
                pass: config.RESEND_API_KEY!,
            },
        });
    }

    public async sendEmail(receiverEmail: string, subject: string, body: string): Promise<void> {
        const transporter = this.createTransporter();

        const mailOptions: SendMailOptions = {
            from: {
                name: 'GregMat',
                address: 'no-reply@gregmat.co',
            },
            to: receiverEmail,
            replyTo: 'no-reply@gregmat.co',
            subject,
            html: body,
            text: stripHtml(body).result,
            messageId: `<${crypto.randomUUID()}@gregmat.co>`,
            priority: 'normal',
            headers: {
                'X-Mailer': 'GregMat Mailer',
                'X-Entity-Ref-ID': crypto.randomUUID(),
            },
        };

        try {
            await transporter.sendMail(mailOptions);
            log.info({ to: receiverEmail }, 'Email sent successfully');
        } catch (error) {
            log.error({ err: error, to: receiverEmail }, 'Error sending email');
            throw new BadRequestError('Error sending email');
        }
    }
}

const mailTransport = new MailTransport();
export default mailTransport;
