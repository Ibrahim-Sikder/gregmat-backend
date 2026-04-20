import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export interface IQuizReference {
    quiz: ObjectId | string;
    order_in_group: number;
}

export interface IQuizGroup extends Document {
    title: string;
    img?: string | null;
    slug: string;
    body: string;
    quizzes: IQuizReference[];
    access: string;
    website: string;
}

export interface IQuizCollection extends Document {
    _id: ObjectId | string;
    title: string;
    tagline?: string;
    slug: string;
    img?: string | null;
    body: string;
    quiz_groups: IQuizGroup[];
    website: string;
    created_at: Date;
    updated_at: Date;
}
