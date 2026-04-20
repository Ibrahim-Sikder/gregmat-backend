import { CatchAsync } from '@global/decorators/catch-async';
import { BadRequestError } from '@global/helpers/error-handlers';
import sendResponse from '@global/helpers/sendResponse';
import galleryService from '@service/db/gallery.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class Image {
    @CatchAsync()
    public async uploadImage(req: Request, res: Response): Promise<void> {
        const files = req.files as Express.Multer.File[];

        if (!files || !files.length) {
            throw new BadRequestError('No files uploaded');
        }

        const result = await galleryService.createImage(files);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Images uploaded successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getImages(req: Request, res: Response): Promise<void> {
        const result = await galleryService.getImages(req.query);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Images retrieved successfully',
            data: result.result,
            meta: result.meta,
        });
    }

    @CatchAsync()
    public async deleteImage(req: Request, res: Response): Promise<void> {
        await galleryService.deleteImage(req);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Image deleted successfully',
            data: null,
        });
    }
}

export default Image;
