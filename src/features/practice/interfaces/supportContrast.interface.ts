import type { Document, Types } from 'mongoose';

export interface ISupportContrastBlank {
    id: number;
    blank_index: number;
    reasoning_type: 'support' | 'contrast';
    acceptable_tokens: string;
}

export interface ISupportContrast extends Document {
    id?: number;
    title: string;
    slug: string;
    text: string;
    blanks: ISupportContrastBlank[];
    acceptance: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface ISupportContrastAttempt extends Document {
    user: Types.ObjectId;
    support_contrast: Types.ObjectId;
    blank_index: number;
    reasoning_type: 'support' | 'contrast';
    associated_token: string;
    correct: boolean;
    first: boolean;
    really_first: boolean;
    created_at: Date;
}
