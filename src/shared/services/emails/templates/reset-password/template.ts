import fs from 'fs';
import ejs from 'ejs';
import type { IResetPasswordParams } from '@user/interfaces/user.interface';

class ResetPasswordConfirmationEmailTemplate {
    public generate(params: IResetPasswordParams): string {
        return ejs.render(fs.readFileSync(__dirname + '/template.ejs', 'utf8'), {
            username: params.username,
            email: params.email,
            ipaddress: params.ipaddress,
            date: params.date,
            logo_url: 'https://ik.imagekit.io/gregmat/gregmat-light_7gI_wBjrqx.webp',
        });
    }
}

export const resetPasswordConfirmationEmailTemplate = new ResetPasswordConfirmationEmailTemplate();
