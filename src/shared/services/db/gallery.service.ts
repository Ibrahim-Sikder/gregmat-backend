import type { IGalleryVideo, IVideoJob } from '@gallery/interfaces/video.interface';
import GalleryImage from '@gallery/models/image.schema';
import GalleryVideoModel from '@gallery/models/video.schema';
import { BadRequestError } from '@global/helpers/error-handlers';
import { config } from '@root/config';
import youTubeService from '@service/db/youtube.service';
import type { Request } from 'express';
import fs from 'fs';

class GalleryService {
    private model = GalleryImage;

    public async createImage(files: Express.Multer.File[]): Promise<any> {
        const uploadResponses = await Promise.all(
            files.map((file) =>
                config.imageKit.upload({
                    file: fs.createReadStream(file.path),
                    fileName: file.originalname,
                })
            )
        );

        const result = await this.model.insertMany(
            uploadResponses.map((upload) => ({
                url: upload.url,
                fileId: upload.fileId,
                name: upload.name,
            }))
        );

        // Clean up local files after upload
        files.forEach((file) => {
            fs.unlinkSync(file.path);
        });

        return result;
    }

    public async getImages(query: Record<string, any>): Promise<any> {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const result = await this.model.find().sort({ createdAt: -1 }).skip(skip).limit(limit);
        const meta = {
            page,
            limit,
            total: await this.model.countDocuments(),
            totalPage: Math.ceil((await this.model.countDocuments()) / limit),
        };

        return {
            result,
            meta,
        };
    }

    public async deleteImage(req: Request): Promise<any> {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new BadRequestError('No image IDs provided');
        }

        const images = await this.model.find({ _id: { $in: ids } });

        if (images.length === 0) {
            throw new BadRequestError('No images found for the provided IDs');
        }

        // Delete from ImageKit
        await Promise.all(images.map((image) => config.imageKit.deleteFile(image.fileId)));

        // Delete from database
        await this.model.deleteMany({ _id: { $in: ids } });

        return;
    }

    // Video
    async createVideo(data: IVideoJob): Promise<any> {
        try {
            const { videoPath, title, roomId, thumbnailPath } = data;
            const videoId = await youTubeService.uploadVideo(
                videoPath,
                thumbnailPath,
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
            // Clean up local files after upload
            fs.unlinkSync(videoPath);
            if (thumbnailPath) fs.unlinkSync(thumbnailPath);
            return savedVideo;
        } catch (error: any) {
            throw new BadRequestError(error.message);
        }
    }

    async createVideoAdmin(data: IGalleryVideo): Promise<any> {
        try {
            return await GalleryVideoModel.create(data);
        } catch (error: any) {
            throw new BadRequestError(error.message);
        }
    }

    async getAllVideos(query: Record<string, any>): Promise<any> {
        const page = parseInt(query.page as string) || 1;
        const limit = parseInt(query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const searchTerm = query.searchTerm as string;

        const result = await GalleryVideoModel.find(
            searchTerm
                ? {
                      title: { $regex: searchTerm, $options: 'i' },
                  }
                : {}
        )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const meta = {
            page,
            limit,
            total: await GalleryVideoModel.countDocuments(),
            totalPage: Math.ceil((await GalleryVideoModel.countDocuments()) / limit),
        };

        return {
            result,
            meta,
        };
    }

    async deleteVideo(req: Request): Promise<void> {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            throw new BadRequestError('No video IDs provided');
        }

        const videos = await GalleryVideoModel.find({ _id: { $in: ids } });

        if (videos.length === 0) {
            throw new BadRequestError('No videos found for the provided IDs');
        }

        // Delete from YouTube
        // await Promise.all(videos.map((video) => youTubeService.deleteVideo(video.videoId)));

        // Delete from database
        await GalleryVideoModel.deleteMany({ _id: { $in: ids } });

        return;
    }
}

const galleryService = new GalleryService();

export default galleryService;
