import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export interface ISentenceSimplifyingSentence {
    id: number;
    body: string;
    order_in_paragraph: number;
    source: string;
    context: string[];
}

export interface ISentenceAttempt {
    sentence: number;
    given_summary: string;
    reported: boolean;
    gpt_score: number | null;
    gpt_comment: string;
}

export interface ISentenceSimplifyingAttempt extends Document {
    _id: ObjectId | string;
    sentenceSimplifyingPractice: ObjectId | string;
    user: ObjectId | string;
    graded: boolean;
    score: number;
    sentence_attempts: ISentenceAttempt[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ISentenceSimplifyingPractice extends Document {
    _id: ObjectId | string;
    title: string;
    slug: string;
    mode: 'paragraph' | 'random';
    user_generated: boolean;
    count: number;
    sentences: ISentenceSimplifyingSentence[];
    attempted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
