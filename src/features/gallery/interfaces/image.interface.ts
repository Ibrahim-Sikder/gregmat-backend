import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export interface IGalleryImage extends Document {
    _id: string | ObjectId;
    url: string;
    fileId: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}
