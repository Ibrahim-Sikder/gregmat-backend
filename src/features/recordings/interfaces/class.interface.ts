import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';
import type { ThumbnailSize } from '@recordings/interfaces/course.interface';

export type ClassType =
    | 'GRE-Quant'
    | 'GRE-Verbal'
    | 'GRE-Writing'
    | 'GRE-General'
    | 'TOEFL'
    | 'IELTS'
    | 'Misc'
    | 'Other';

export interface IClass extends Document {
    _id: ObjectId | string;
    title: string;
    slug: string;
    description?: string;
    groupId?: ObjectId | string;
    order: number;
    classType: ClassType;
    img?: string;
    thumbnailSize: ThumbnailSize;
    plusOnly: boolean;
    video?: string;
    homeworks: string;
    resources: string[];
}
