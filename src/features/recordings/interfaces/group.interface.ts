import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export interface IClassGroup extends Document {
    _id: ObjectId | string;
    title: string;
    slug: string;
    description?: string;
    courseId: ObjectId | string;
    order: number;
    img?: string;
    classes?: ObjectId[] | string[];
}
