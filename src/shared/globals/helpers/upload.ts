import multer from 'multer';
import type { FileFilterCallback } from 'multer';
import type { Request, Response, NextFunction } from 'express';
import { BadRequestError } from './error-handlers';
import path from 'path';
import fs from 'fs';
import { config } from '@root/config';

interface FieldConfig {
    name: string;
    maxCount: number;
}

const log = config.createLogger('upload');

class Upload {
    private multerMiddleware: any;

    private isMultiField: boolean = false;

    constructor(
        private fieldName: string | FieldConfig[],
        private maxCount: number = 1,
        private maxFileSize: number = 2 * 1024 * 1024 * 1024 // 2GB default for videos
    ) {
        log.info('Initializing upload middleware');

        // configure multer
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            log.info('📁 Creating upload directory:', uploadDir);
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                const uploadDir = path.join(process.cwd(), 'uploads');
                if (!fs.existsSync(uploadDir)) {
                    fs.mkdirSync(uploadDir, { recursive: true });
                }
                cb(null, uploadDir);
            },
            filename: (req, file, cb) => {
                // Use original name for better debugging
                cb(null, `${Date.now()}-${file.originalname}`);
            },
        });

        // Allow images + videos
        const allowedMimeTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
            'video/mp4',
            'video/webm',
        ];

        const fileFilter = (
            req: Request,
            file: Express.Multer.File,
            cb: FileFilterCallback
        ): void => {
            if (allowedMimeTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new BadRequestError('Invalid file type. Only images/videos are allowed.'));
            }
        };

        const multerInstance = multer({
            storage,
            limits: {
                fileSize: this.maxFileSize,
                fieldNameSize: 100,
                fieldSize: 1000000,
                files: 10,
            },
            fileFilter,
        });

        if (Array.isArray(fieldName)) {
            this.isMultiField = true;
            this.multerMiddleware = multerInstance.fields(fieldName);
            log.info('Configured for multiple fields:', fieldName);
        } else {
            this.multerMiddleware =
                this.maxCount === 1
                    ? multerInstance.single(fieldName)
                    : multerInstance.array(fieldName, this.maxCount);
            log.info(`Configured for single field: "${fieldName}" with maxCount: ${this.maxCount}`);
        }
    }

    public handle = (req: Request, res: Response, next: NextFunction): void => {
        log.info('Handling file upload');
        this.multerMiddleware(req, res, (err: any) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return next(
                            new BadRequestError(
                                `File too large. Max size is ${this.maxFileSize / (1024 * 1024 * 1024)} GB.`
                            )
                        );
                    }
                    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                        const expectedField = this.isMultiField
                            ? 'expected fields'
                            : `"${this.fieldName as string}"`;
                        return next(
                            new BadRequestError(`Unexpected file field. Use ${expectedField}`)
                        );
                    }
                }
                return next(err);
            }
            next();
        });
    };
}

export default Upload;
