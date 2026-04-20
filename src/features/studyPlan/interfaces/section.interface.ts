import type { Document, Model } from 'mongoose';
import type { ObjectId } from 'mongodb';

export interface ISection extends Document {
    _id: ObjectId | string;
    title: string;
    slug: string;
    description?: string;
    img: string | null;
    img2: string | null;
    studyPlan: ObjectId | string;
    units: ObjectId[];
    plusOnly: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}
