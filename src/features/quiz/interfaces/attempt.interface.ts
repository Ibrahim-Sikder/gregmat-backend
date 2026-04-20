import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export interface IQuestionAttempt {
    user: ObjectId | string;
    answered_at: Date;
    given_answer: string;
    correct: boolean;
    question: ObjectId | string;
    quiz: ObjectId | string;
    collection: ObjectId | string;
    score: number;
    score_denom: number;
    seconds: number;
}

export interface IAttempt extends Document {
    _id: ObjectId;
    created_at: Date;
    attempts: IQuestionAttempt[];
    given_essay: string;
    createdAt?: Date;
    updatedAt?: Date;
}
