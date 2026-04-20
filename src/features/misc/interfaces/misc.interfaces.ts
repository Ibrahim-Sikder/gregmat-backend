import type { Document } from 'mongoose';

export interface Video {
    url: string | null;
    embed_code: string;
    duration: number;
}

export interface MiscQuiz extends Document {
    title: string;
    slug: string;
    banner: string;
    description: string;
    plus_only: boolean;
    video: Video;
}
