import type { Document } from 'mongoose';

export interface IPair {
    first_word: string;
    second_word: string;
}

export interface IPairing extends Document {
    id?: number;
    title: string;
    slug: string;
    body: string;
    pairs: IPair[];
    acceptance: number;
    created_at?: Date;
    updated_at?: Date;
}

export interface IPairAttemptItem {
    first_word: string;
    second_word: string;
}

export interface IPairingAttempt extends Document {
    user: string;
    pairing: string;
    score: number;
    correct: boolean;
    first: boolean;
    really_first: boolean;
    attempt: IPairAttemptItem[];
    created_at: Date;
}
