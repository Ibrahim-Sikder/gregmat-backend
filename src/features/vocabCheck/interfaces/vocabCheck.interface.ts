import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export interface IVocabCheckWord {
    id: ObjectId;
    word: string;
    definition: string;
}

export interface IVocabCheckGroup {
    id: ObjectId;
    number: number;
}

export interface IVocabCheckWordAttempt {
    id: ObjectId;
    word: ObjectId;
    given_definition?: string;
    gpt_score: number;
    gpt_comment: string;
    reported: boolean;
}

export interface IVocabCheckAttempt {
    id: ObjectId;
    created_at: Date;
    first: boolean;
    graded: boolean;
    score: number;
    word_attempts: IVocabCheckWordAttempt[];
}

export interface IVocabCheck extends Document {
    userId: ObjectId;
    words: IVocabCheckWord[];
    groups: IVocabCheckGroup[];
    attempts: IVocabCheckAttempt[];
    createdAt: Date;
    updatedAt: Date;
}
