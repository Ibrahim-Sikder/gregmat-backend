import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export enum VideoPrivacyStatus {
    Private = 'private',
    Unlisted = 'unlisted',
    Public = 'public',
}

export interface IGalleryVideo extends Document {
    _id: string | ObjectId;
    title: string;
    description?: string;
    videoId: string;
    url: string;
    thumbnail?: string;
    privacyStatus: VideoPrivacyStatus;
    duration?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IVideoJob {
    videoPath: string;
    thumbnailPath: string;
    title: string;
    roomId: string;
}

export interface IChunkCleanupJob {
    timestamp: Date;
}
