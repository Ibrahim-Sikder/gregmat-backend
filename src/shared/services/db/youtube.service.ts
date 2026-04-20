import { BadRequestError } from '@global/helpers/error-handlers';
import { config } from '@root/config';
import type Logger from 'bunyan';
import fs from 'fs';
import { google, type youtube_v3 } from 'googleapis';
const log: Logger = config.createLogger('YouTubeService');

class YouTubeService {
    async getAuthenticatedYouTube(): Promise<youtube_v3.Youtube> {
        if (config.ADMIN_REFRESH_TOKEN) {
            config.oauth2Client.setCredentials({
                refresh_token: config.ADMIN_REFRESH_TOKEN,
            });
        }

        try {
            await config.oauth2Client.getAccessToken();
        } catch (error) {
            log.error('Failed to get access token:', error);
            throw new BadRequestError('YouTube authentication failed. Please re-authenticate.');
        }

        return google.youtube({ version: 'v3', auth: config.oauth2Client });
    }

    async uploadVideo(
        videoPath: string,
        thumbnailPath: string,
        title: string,
        description?: string,
        privacyStatus: 'private' | 'public' | 'unlisted' = 'unlisted'
    ): Promise<string> {
        try {
            const youtube = await this.getAuthenticatedYouTube();

            log.info(`Starting YouTube video upload: ${title}`);

            const response = await youtube.videos.insert({
                part: ['snippet', 'status'],
                requestBody: {
                    snippet: {
                        title,
                        description: description || `Uploaded via ${config.APP_NAME}`,
                        tags: ['education', 'gregmat', 'learning'],
                        categoryId: '27', // Education category
                        defaultLanguage: 'en',
                    },
                    status: {
                        privacyStatus,
                        embeddable: true,
                        license: 'youtube',
                    },
                },
                media: { body: fs.createReadStream(videoPath) },
            });

            const videoId = response.data.id;
            if (!videoId) {
                throw new BadRequestError('No video ID returned from YouTube');
            }

            await youtube.thumbnails.set({
                videoId,
                media: { body: fs.createReadStream(thumbnailPath) },
            });

            log.info(`Successfully uploaded video to YouTube: ${videoId}`);

            return videoId;
        } catch (error: any) {
            log.error('YouTube upload failed:', error);

            if (error.code === 401) {
                throw new BadRequestError(
                    'YouTube authentication expired. Please re-authenticate.'
                );
            }

            if (error.code === 403) {
                throw new BadRequestError('YouTube API quota exceeded or permission denied.');
            }

            if (error.code === 400) {
                throw new BadRequestError('Invalid video file or metadata provided.');
            }

            throw new BadRequestError(`YouTube upload failed: ${error.message || 'Unknown error'}`);
        }
    }

    async getVideoDetails(videoId: string): Promise<youtube_v3.Schema$Video | null> {
        try {
            const youtube = await this.getAuthenticatedYouTube();

            const response = await youtube.videos.list({
                part: ['snippet', 'status', 'contentDetails'],
                id: [videoId],
            });

            return response.data.items?.[0] || null;
        } catch (error: any) {
            log.error('Failed to get video details:', error);
            throw new Error(`Failed to get video details: ${error.message}`);
        }
    }

    async deleteVideo(videoId: string): Promise<void> {
        try {
            const youtube = await this.getAuthenticatedYouTube();

            await youtube.videos.delete({
                id: videoId,
            });

            log.info(`Deleted video: ${videoId}`);
        } catch (error: any) {
            log.error('Failed to delete video:', error);
            throw new Error(`Failed to delete video: ${error.message}`);
        }
    }

    generateAuthUrl(): string {
        const scopes = [
            'https://www.googleapis.com/auth/youtube.upload',
            'https://www.googleapis.com/auth/youtube',
            'https://www.googleapis.com/auth/youtube.force-ssl',
        ];

        return config.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
            prompt: 'consent',
        });
    }

    async exchangeCodeForTokens(code: string): Promise<any> {
        try {
            const { tokens } = await config.oauth2Client.getToken(code);
            config.oauth2Client.setCredentials(tokens);

            log.info('Successfully obtained YouTube tokens');
            return tokens;
        } catch (error: any) {
            log.error('Failed to exchange code for tokens:', error);
            throw new Error(`Failed to authenticate: ${error.message}`);
        }
    }
}

const youTubeService = new YouTubeService();

export default youTubeService;
