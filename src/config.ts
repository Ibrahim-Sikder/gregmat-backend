import type Logger from 'bunyan';
import bunyan from 'bunyan';
import dotenv from 'dotenv';
import type { Auth } from 'googleapis';
import { google } from 'googleapis';
import ImageKit from 'imagekit';

dotenv.config({
    path: process.cwd() + '/.env',
});

class Config {
    public APP_NAME: string | undefined;

    public PORT: number | undefined;

    public NODE_ENV: string | undefined;

    public API_URL: string | undefined;

    public CLIENT_URL: string | undefined;

    public ADMIN_URL: string | undefined;

    public DATABASE_URL: string | undefined;

    public REDIS_HOST: string | undefined;

    public JWT_TOKEN: string | undefined;

    public SECRET_KEY_ONE: string | undefined;

    public SECRET_KEY_TWO: string | undefined;

    public IMAGEKIT_PUBLIC_KEY: string | undefined;

    public IMAGEKIT_PRIVATE_KEY: string | undefined;

    public IMAGEKIT_URL_ENDPOINT: string | undefined;

    public SENDER_EMAIL: string | undefined;

    public SENDER_EMAIL_PASSWORD: string | undefined;

    public RESEND_API_KEY: string | undefined;

    public GOOGLE_CLIENT_ID: string | undefined;

    public GOOGLE_CLIENT_SECRET: string | undefined;

    public GOOGLE_REDIRECT_URI: string | undefined;

    public ADMIN_REFRESH_TOKEN: string | undefined;

    private readonly DEFAULT_DATABASE_URL = 'mongodb://localhost:27017/gregmat';

    public imageKit: ImageKit;

    public oauth2Client: Auth.OAuth2Client;

    public GEMINI_API_KEY: string | undefined;

    private logger: Logger;

    constructor() {
        this.logger = this.createLogger('Config');

        // General
        this.PORT = process.env.PORT ? Number(process.env.PORT) : 5000;
        this.APP_NAME = process.env.APP_NAME || '';
        this.NODE_ENV = process.env.NODE_ENV || '';
        this.API_URL = process.env.API_URL || '';
        this.CLIENT_URL = process.env.CLIENT_URL || '';
        this.ADMIN_URL = process.env.ADMIN_URL || '';

        // Database
        this.DATABASE_URL = process.env.DATABASE_URL || this.DEFAULT_DATABASE_URL;
        this.REDIS_HOST = process.env.REDIS_HOST || '';

        // Authentication
        this.JWT_TOKEN = process.env.JWT_TOKEN || '1234';
        this.SECRET_KEY_ONE = process.env.SECRET_KEY_ONE || '';
        this.SECRET_KEY_TWO = process.env.SECRET_KEY_TWO || '';

        // ImageKit
        this.IMAGEKIT_PUBLIC_KEY = process.env.IMAGEKIT_PUBLIC_KEY || '';
        this.IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || '';
        this.IMAGEKIT_URL_ENDPOINT = process.env.IMAGEKIT_URL_ENDPOINT || '';

        // Email
        this.SENDER_EMAIL = process.env.SENDER_EMAIL || '';
        this.SENDER_EMAIL_PASSWORD = process.env.SENDER_EMAIL_PASSWORD || '';
        this.RESEND_API_KEY = process.env.RESEND_API_KEY || '';

        // Google
        this.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
        this.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
        this.GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || '';
        this.ADMIN_REFRESH_TOKEN = process.env.ADMIN_REFRESH_TOKEN || '';

        this.imageKit = new ImageKit({
            publicKey: this.IMAGEKIT_PUBLIC_KEY!,
            privateKey: this.IMAGEKIT_PRIVATE_KEY!,
            urlEndpoint: this.IMAGEKIT_URL_ENDPOINT!,
        });

        this.oauth2Client = new google.auth.OAuth2(
            this.GOOGLE_CLIENT_ID,
            this.GOOGLE_CLIENT_SECRET,
            this.GOOGLE_REDIRECT_URI
        );

        this.oauth2Client.setCredentials({
            refresh_token: this.ADMIN_REFRESH_TOKEN,
        });

        this.GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
    }

    public createLogger(name: string): bunyan {
        return bunyan.createLogger({
            name,
            level: this.NODE_ENV === 'production' ? 'info' : 'debug',
            // Limit the number of log records in memory
            streams: [
                {
                    level: this.NODE_ENV === 'production' ? 'info' : 'debug',
                    stream: process.stdout,
                },
            ],
        });
    }

    public validateConfig(): void {
        for (const [key, value] of Object.entries(this)) {
            if (value === undefined) {
                throw new Error(`Configuration ${key} is undefined.`);
            }
        }
    }
}

export const config = new Config();
