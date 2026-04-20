import GalleryVideoModel from '@gallery/models/video.schema';
import { CatchAsync } from '@global/decorators/catch-async';
import ChunkUpload from '@global/helpers/chunk-upload';
import sendResponse from '@global/helpers/sendResponse';
import { config } from '@root/config';
import galleryService from '@service/db/gallery.service';
import youTubeService from '@service/db/youtube.service';
import type { Request, Response } from 'express';
import fs from 'fs';
import HTTP_STATUS from 'http-status-codes';

const log = config.createLogger('video');
const chunkUpload = new ChunkUpload();

class Video {
    @CatchAsync()
    public async assembleVideo(req: Request, res: Response): Promise<void> {
        let videoPath: string | undefined;
        let thumbnailPath: string | undefined;

        try {
            const {
                videoFileId,
                videoOriginalName,
                title,
                thumbnailFileId,
                thumbnailOriginalName,
            } = req.body;

            if (!videoFileId || !videoOriginalName || !title) {
                return sendResponse(res, {
                    statusCode: HTTP_STATUS.BAD_REQUEST,
                    success: false,
                    message: 'Missing required fields',
                    data: null,
                });
            }

            // Assemble video from chunks
            videoPath = await chunkUpload.assembleFile(videoFileId, videoOriginalName);

            // Assemble thumbnail if provided
            if (thumbnailFileId && thumbnailOriginalName) {
                thumbnailPath = await chunkUpload.assembleFile(
                    thumbnailFileId,
                    thumbnailOriginalName
                );
            }

            // Upload to YouTube
            const videoId = await youTubeService.uploadVideo(
                videoPath,
                thumbnailPath || '', // Handle case where no thumbnail
                title,
                `Video uploaded via GregMat platform`,
                'unlisted'
            );

            const url = `https://www.youtube.com/watch?v=${videoId}`;

            const savedVideo = await GalleryVideoModel.create({
                title,
                videoId,
                url,
                privacyStatus: 'unlisted',
            });

            // Clean up assembled files
            if (videoPath && fs.existsSync(videoPath)) {
                fs.unlinkSync(videoPath);
            }
            if (thumbnailPath && fs.existsSync(thumbnailPath)) {
                fs.unlinkSync(thumbnailPath);
            }

            sendResponse(res, {
                statusCode: HTTP_STATUS.OK,
                success: true,
                message: 'Video uploaded successfully',
                data: { videoId, title: savedVideo.title },
            });
        } catch (error) {
            log.error('Error assembling video:', error);

            // Clean up assembled files on error
            try {
                if (videoPath && fs.existsSync(videoPath)) {
                    fs.unlinkSync(videoPath);
                }
                if (thumbnailPath && fs.existsSync(thumbnailPath)) {
                    fs.unlinkSync(thumbnailPath);
                }
            } catch (cleanupError) {
                log.error('Error cleaning up files after failed assembly:', cleanupError);
            }

            sendResponse(res, {
                statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
                success: false,
                message: error instanceof Error ? error.message : 'Failed to assemble video',
                data: null,
            });
        }
    }

    public async create(req: Request, res: Response): Promise<void> {
        const data = req.body;
        const video = await galleryService.createVideoAdmin(data);

        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Video created successfully',
            data: video,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await galleryService.getAllVideos(req.query);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Videos retrieved successfully',
            data: result.result,
            meta: result.meta,
        });
    }

    public async delete(req: Request, res: Response): Promise<void> {
        await galleryService.deleteVideo(req);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Video deleted successfully',
            data: null,
        });
    }
}

export default Video;
