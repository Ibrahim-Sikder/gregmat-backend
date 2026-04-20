import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export interface SuperQuiz extends Document {
    _id: ObjectId;
    title: string;
    description?: string;
    questions: ObjectId[];
    userId: ObjectId;
    attempts: ObjectId[];
    createdAt: Date;
    updatedAt: Date;
}
