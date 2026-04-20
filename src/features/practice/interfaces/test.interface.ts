import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export interface ITest extends Document {
    _id: ObjectId | string;
    title: string;
    tagline: string;
    slug: string;
    description?: string;
}
