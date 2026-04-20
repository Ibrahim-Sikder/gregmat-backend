import type { IClassGroup } from '@recordings/interfaces/group.interface';
import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export type ThumbnailSize = 3 | 4 | 6 | 12;

export interface ICourse extends Document {
    _id: ObjectId | string;
    title: string;
    slug: string;
    description?: string;
    seriesId: ObjectId | string;
    order: number;
    thumbnailSize: ThumbnailSize;
    img?: string;
    banner?: string;
    groups?: IClassGroup[];
    isActive: boolean;
}
