import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';
import type { ICourse } from '@recordings/interfaces/course.interface';

export interface ICourseSeries extends Document {
    _id: ObjectId | string;
    title: string;
    slug: string;
    description?: string;
    order: number;
    img?: string;
    courses?: ICourse[];
    isQuizSeries?: boolean;
    isAdmissionSeries?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
