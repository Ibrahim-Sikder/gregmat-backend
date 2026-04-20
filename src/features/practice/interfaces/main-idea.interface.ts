import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export interface ISentence {
    body: string;
    order_in_paragraph: number;
    source: string;
    context?: string | null;
}

export interface IParagraph {
    order_in_passage: number;
    body: string;
    sentences: ISentence[];
    main_idea: string;
    passage_source: string;
    context: string;
}

export interface IParagraphAttempt {
    paragraph: ObjectId | string;
    given_main_idea: string;
    reported: boolean;
    gpt_score: number | null;
    gpt_comment: string;
}

export interface IMainIdeaAttempt extends Document {
    _id: ObjectId | string;
    mainIdeaPractice: ObjectId | string;
    user: ObjectId | string;
    graded: boolean;
    score: number;
    paragraph_attempts: IParagraphAttempt[];
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IMainIdeaPractice extends Document {
    _id: ObjectId | string;
    title: string;
    slug: string;
    mode: 'paragraph' | 'Passage';
    user_generated: boolean;
    count: number;
    paragraphs: ObjectId[] | string[];
    attempted: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IParagraphDocument extends Document {
    _id: ObjectId | string;
    mainIdeaPractice: ObjectId | string;
    order_in_passage: number;
    body: string;
    sentences: ISentence[];
    main_idea: string;
    passage_source: string;
    context: string;
}
