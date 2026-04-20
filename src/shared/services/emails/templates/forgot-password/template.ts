import fs from 'fs';
import ejs from 'ejs';

class ForgotPasswordEmailTemplate {
    public generate(username: string, resetLink: string): string {
        return ejs.render(fs.readFileSync(__dirname + '/template.ejs', 'utf8'), {
            username,
            resetLink,
            logo_url: 'https://ik.imagekit.io/gregmat/gregmat-light_7gI_wBjrqx.webp',
        });
    }
}

export const forgotPasswordEmailTemplate: ForgotPasswordEmailTemplate =
    new ForgotPasswordEmailTemplate();
