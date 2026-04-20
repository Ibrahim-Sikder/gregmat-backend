import { config } from '@root/config';
import type { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import multer from 'multer';
import path from 'path';
import { BadRequestError } from './error-handlers';

const log = config.createLogger('upload-chunk');

interface ChunkMetadata {
    chunkNumber: number;
    totalChunks: number;
    originalName: string;
    totalSize: number;
    chunkSize: number;
    fileId: string;
    fieldName: string;
}

class ChunkUpload {
    private uploadDir: string;

    private chunksDir: string;

    private readonly MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5GB max

    private readonly CHUNK_SIZE = 300 * 1024 * 1024; // 300MB per chunk

    constructor() {
        this.uploadDir = path.join(process.cwd(), 'uploads');
        this.chunksDir = path.join(this.uploadDir, 'chunks');
        this.ensureDirectories();
    }

    private ensureDirectories(): void {
        if (!fs.existsSync(this.uploadDir)) {
            fs.mkdirSync(this.uploadDir, { recursive: true });
        }
        if (!fs.existsSync(this.chunksDir)) {
            fs.mkdirSync(this.chunksDir, { recursive: true });
        }
    }

    public async cleanupCompletedUpload(fileId: string): Promise<void> {
        const chunkDir = this.getChunkDir(fileId);
        if (fs.existsSync(chunkDir)) {
            try {
                await fsPromises.rm(chunkDir, { recursive: true, force: true });
                log.info(`Cleaned up chunks for completed upload: ${fileId}`);
            } catch (error) {
                log.error(`Error cleaning up chunks for fileId ${fileId}:`, error);
            }
        }
    }

    private getChunkDir(fileId: string): string {
        return path.join(this.chunksDir, fileId);
    }

    private validateChunkMetadata(metadata: ChunkMetadata): void {
        if (!metadata.fileId || !metadata.originalName) {
            throw new BadRequestError('Invalid chunk metadata: missing fileId or originalName');
        }
        if (metadata.chunkNumber < 0 || metadata.totalChunks <= 0) {
            throw new BadRequestError('Invalid chunk numbers');
        }
        if (metadata.chunkNumber >= metadata.totalChunks) {
            throw new BadRequestError('Chunk number exceeds total chunks');
        }
        if (metadata.totalSize > this.MAX_FILE_SIZE) {
            throw new BadRequestError(
                `File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE / (1024 * 1024 * 1024)}GB`
            );
        }
    }

    public handleChunk = (req: Request, res: Response, next: NextFunction): void => {
        // CRITICAL: Use diskStorage instead of memoryStorage to prevent memory issues
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                // Use a temporary directory first, we'll move it later
                const tempDir = path.join(this.chunksDir, 'temp');

                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }

                cb(null, tempDir);
            },
            filename: (req, file, cb) => {
                // Generate a unique temporary filename
                cb(null, `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
            },
        });

        const upload = multer({
            storage: storage,
            limits: {
                fileSize: this.CHUNK_SIZE,
            },
        }).single('chunk');

        upload(req, res, async (err) => {
            try {
                if (err) {
                    log.error('Multer error:', err);
                    if (err instanceof multer.MulterError) {
                        return next(new BadRequestError(`Upload error: ${err.message}`));
                    }
                    return next(err);
                }

                if (!req.file) {
                    return next(new BadRequestError('No file chunk received'));
                }

                await this.processChunk(req, res, next);
            } catch (error) {
                log.error('Error in handleChunk:', error);
                next(error);
            }
        });
    };

    public async cleanupStaleChunks(maxAgeHours: number = 24): Promise<void> {
        try {
            if (!fs.existsSync(this.chunksDir)) {
                return;
            }

            const directories = await fsPromises.readdir(this.chunksDir, { withFileTypes: true });
            const now = Date.now();
            const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

            for (const dir of directories) {
                if (dir.isDirectory()) {
                    const dirPath = path.join(this.chunksDir, dir.name);
                    const metadataPath = path.join(dirPath, 'metadata.json');

                    try {
                        let shouldDelete = false;

                        if (fs.existsSync(metadataPath)) {
                            const metadata = JSON.parse(
                                await fsPromises.readFile(metadataPath, 'utf-8')
                            );
                            const lastUpdated = new Date(metadata.lastUpdated).getTime();

                            if (now - lastUpdated > maxAgeMs) {
                                shouldDelete = true;
                                log.info(
                                    `Deleting stale chunks directory (${maxAgeHours}h old): ${dir.name}`
                                );
                            }
                        } else {
                            // No metadata, check directory creation time
                            const stats = await fsPromises.stat(dirPath);
                            if (now - stats.birthtime.getTime() > maxAgeMs) {
                                shouldDelete = true;
                                log.info(
                                    `Deleting stale chunks directory (no metadata, ${maxAgeHours}h old): ${dir.name}`
                                );
                            }
                        }

                        if (shouldDelete) {
                            await fsPromises.rm(dirPath, { recursive: true, force: true });
                        }
                    } catch (error) {
                        log.error(`Error processing directory ${dir.name}:`, error);
                    }
                }
            }
        } catch (error) {
            log.error('Error cleaning up stale chunks:', error);
        }
    }

    private async processChunk(req: Request, res: Response, next: NextFunction): Promise<void> {
        let tempFilePath: string | undefined;

        try {
            const metadata: ChunkMetadata = JSON.parse(req.body.metadata);
            this.validateChunkMetadata(metadata);

            const chunkDir = this.getChunkDir(metadata.fileId);
            if (!fs.existsSync(chunkDir)) {
                fs.mkdirSync(chunkDir, { recursive: true });
            }

            // Move file from temp to correct location with correct name
            const finalChunkPath = path.join(chunkDir, `chunk-${metadata.chunkNumber}`);
            tempFilePath = req.file?.path;

            if (tempFilePath) {
                await fsPromises.rename(tempFilePath, finalChunkPath);
            }

            log.info(
                `Saved chunk ${metadata.chunkNumber + 1}/${metadata.totalChunks} for ${metadata.originalName} (fileId: ${metadata.fileId})`
            );

            // Store metadata for validation during assembly
            const metadataPath = path.join(chunkDir, 'metadata.json');
            let existingMetadata: any = {};

            try {
                if (fs.existsSync(metadataPath)) {
                    const content = await fsPromises.readFile(metadataPath, 'utf-8');
                    existingMetadata = JSON.parse(content);
                }
            } catch (error) {
                log.warn('Could not read existing metadata, creating new:', error);
            }

            existingMetadata.totalChunks = metadata.totalChunks;
            existingMetadata.originalName = metadata.originalName;
            existingMetadata.totalSize = metadata.totalSize;
            existingMetadata.lastChunkNumber = metadata.chunkNumber;
            existingMetadata.lastUpdated = new Date().toISOString();

            await fsPromises.writeFile(metadataPath, JSON.stringify(existingMetadata, null, 2));

            res.status(200).json({
                success: true,
                chunkNumber: metadata.chunkNumber,
                received: true,
                totalChunks: metadata.totalChunks,
            });
        } catch (error) {
            log.error('Error processing chunk:', error);

            // Clean up the temp file if processing fails
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                try {
                    await fsPromises.unlink(tempFilePath);
                    log.info('Cleaned up temp file after error');
                } catch (unlinkError) {
                    log.error('Error cleaning up temp file:', unlinkError);
                }
            }

            next(error);
        }
    }

    public async assembleFile(fileId: string, originalName: string): Promise<string> {
        const chunkDir = this.getChunkDir(fileId);
        const outputPath = path.join(this.uploadDir, `${fileId}-${originalName}`);

        if (!fs.existsSync(chunkDir)) {
            throw new BadRequestError(`No chunks found for file ${fileId}`);
        }

        // Read and validate metadata
        const metadataPath = path.join(chunkDir, 'metadata.json');
        if (!fs.existsSync(metadataPath)) {
            throw new BadRequestError('Upload metadata not found');
        }

        const metadata = JSON.parse(await fsPromises.readFile(metadataPath, 'utf-8'));
        log.info(`Starting assembly for ${originalName}, expected chunks: ${metadata.totalChunks}`);

        // Get all chunk files
        const chunkFiles = fs
            .readdirSync(chunkDir)
            .filter((f) => f.startsWith('chunk-'))
            .sort((a, b) => {
                const aNum = parseInt(a.split('-')[1]);
                const bNum = parseInt(b.split('-')[1]);
                return aNum - bNum;
            });

        // Validate all chunks are present
        if (chunkFiles.length !== metadata.totalChunks) {
            throw new BadRequestError(
                `Incomplete upload: expected ${metadata.totalChunks} chunks, found ${chunkFiles.length}`
            );
        }

        log.info(`Assembling ${chunkFiles.length} chunks for ${originalName}`);

        // Use streams for memory-efficient assembly
        const writeStream = fs.createWriteStream(outputPath);

        try {
            for (let i = 0; i < chunkFiles.length; i++) {
                const chunkFile = chunkFiles[i];
                const chunkPath = path.join(chunkDir, chunkFile);

                log.info(`Processing chunk ${i + 1}/${chunkFiles.length}`);

                // Use stream to avoid loading entire chunk into memory
                await new Promise<void>((resolve, reject) => {
                    const readStream = fs.createReadStream(chunkPath, {
                        highWaterMark: 64 * 1024, // 64KB buffer
                    });

                    readStream.on('data', (chunk) => {
                        if (!writeStream.write(chunk)) {
                            readStream.pause();
                            writeStream.once('drain', () => readStream.resume());
                        }
                    });

                    readStream.on('end', resolve);
                    readStream.on('error', reject);
                });
            }

            // Close the write stream
            writeStream.end();

            return new Promise((resolve, reject) => {
                writeStream.on('finish', async () => {
                    try {
                        log.info(`Successfully assembled file: ${outputPath}`);

                        // Verify file size
                        const stats = await fsPromises.stat(outputPath);
                        log.info(
                            `Assembled file size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`
                        );

                        // Clean up chunks
                        await this.cleanupChunks(fileId);
                        resolve(outputPath);
                    } catch (error) {
                        reject(error);
                    }
                });

                writeStream.on('error', (error) => {
                    log.error('Error writing assembled file:', error);
                    reject(error);
                });
            });
        } catch (error) {
            log.error('Error during file assembly:', error);

            // Clean up partial file on error
            if (fs.existsSync(outputPath)) {
                try {
                    await fsPromises.unlink(outputPath);
                    log.info('Cleaned up partial assembled file');
                } catch (unlinkError) {
                    log.error('Error cleaning up partial file:', unlinkError);
                }
            }
            throw error;
        }
    }

    private async cleanupChunks(fileId: string): Promise<void> {
        const chunkDir = this.getChunkDir(fileId);
        if (fs.existsSync(chunkDir)) {
            try {
                await fsPromises.rm(chunkDir, { recursive: true, force: true });
                log.info(`Cleaned up chunks for fileId: ${fileId}`);
            } catch (error) {
                log.error(`Error cleaning up chunks for fileId ${fileId}:`, error);
            }
        }
    }

    public getUploadProgress(fileId: string): { received: number; total: number } {
        const chunkDir = this.getChunkDir(fileId);
        if (!fs.existsSync(chunkDir)) {
            return { received: 0, total: 0 };
        }

        const metadataPath = path.join(chunkDir, 'metadata.json');
        let totalChunks = 0;

        if (fs.existsSync(metadataPath)) {
            try {
                const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
                totalChunks = metadata.totalChunks || 0;
            } catch (error) {
                log.error('Error reading metadata for progress:', error);
            }
        }

        const chunks = fs.readdirSync(chunkDir).filter((f) => f.startsWith('chunk-'));
        return { received: chunks.length, total: totalChunks };
    }

    // Add method to resume failed uploads
    public getMissingChunks(fileId: string): number[] {
        const chunkDir = this.getChunkDir(fileId);
        if (!fs.existsSync(chunkDir)) {
            return [];
        }

        const metadataPath = path.join(chunkDir, 'metadata.json');
        if (!fs.existsSync(metadataPath)) {
            return [];
        }

        try {
            const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
            const totalChunks = metadata.totalChunks;

            const existingChunks = fs
                .readdirSync(chunkDir)
                .filter((f) => f.startsWith('chunk-'))
                .map((f) => parseInt(f.split('-')[1]));

            const missing: number[] = [];
            for (let i = 0; i < totalChunks; i++) {
                if (!existingChunks.includes(i)) {
                    missing.push(i);
                }
            }

            return missing;
        } catch (error) {
            log.error('Error getting missing chunks:', error);
            return [];
        }
    }
}

export default ChunkUpload;
