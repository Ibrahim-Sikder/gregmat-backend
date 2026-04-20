import type { Document, Types } from 'mongoose';

export interface IUserProgress extends Document {
    userId: Types.ObjectId;
    courseId: Types.ObjectId;
    courseTitle?: string;
    categoryId: Types.ObjectId;
    categoriesTitle?: string;
    contentId: Types.ObjectId;
    contentTitle?: string;
    videoUrl?: string;
    saved: boolean;
    watched: boolean;
    watchedAt?: Date;
    savedAt?: Date;
    watchProgress?: number;
    lastWatchedPosition?: number;
}

export interface IUserProgressCreate {
    userId: string;
    courseId: string;
    categoryId: string;
    contentId: string;
    saved?: boolean;
    watched?: boolean;
    watchProgress?: number;
    lastWatchedPosition?: number;
}
