import type { Document } from 'mongoose';

export interface ISentencePart {
    id: number;
    order: number;
    content: string;
    description: string;
    is_answer: boolean;
}

export interface ISentenceFunction extends Document {
    id?: number;
    title: string;
    slug: string;
    body: string;
    source: string;
    sentence_parts: ISentencePart[];
    acceptance: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface ISentenceFunctionAttempt extends Document {
    user: string;
    sentence_function: string;
    selected_sentence_part: number;
    correct: boolean;
    first: boolean;
    really_first: boolean;
    created_at: Date;
}
