import fs from 'fs';
import ejs from 'ejs';
import path from 'path';

class VerificationEmailTemplate {
    public generate(username: string, verificationLink: string): string {
        return ejs.render(fs.readFileSync(path.join(__dirname, 'template.ejs'), 'utf8'), {
            username,
            verificationLink,
            logo_url: 'https://ik.imagekit.io/gregmat/gregmat-light_7gI_wBjrqx.webp',
        });
    }
}

export const verificationEmailTemplate = new VerificationEmailTemplate();
