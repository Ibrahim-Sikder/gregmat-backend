import type { Document } from 'mongoose';

export interface IChoiceGroup {
    title?: string;
    choices: {
        order: number;
        title: string;
        body: string;
    }[];
}

export interface ILeftSideText {
    title: string;
    body: string;
}

export interface IProblem extends Document {
    title: string;
    type: string;
    difficulty: string;
    super_category: string; // 'Quant' or 'Verbal'
    isPlusOnly: boolean;
    acceptanceRate: number;
    slug: string;
    browserTitle: string;
    likes: number;
    hasSolutionVideo: boolean;
    firstTlc: string | null;
    tags: string[];
    
    // Detailed fields matching Question Form
    shortMeta?: string;
    body?: string; // HTML content
    answer?: string; // The correct answer string
    choiceGroups?: IChoiceGroup[];
    canWatch?: boolean;
    solutionVideo?: string | null;
    solutionHasVideo?: boolean;
    maxScore?: number;
    source?: string | null;
    note?: string; // Solution Video Explanation
    leftSideText?: ILeftSideText | null;

    createdAt: Date;
    updatedAt: Date;
}

export interface IProblemAttempt extends Document {
    userId: string;
    problemId: string;
    isCorrect: boolean;
    attemptedAt: Date;
    answer?: any;
    first: boolean;
}

export interface IUserProblemAction extends Document {
    userId: string;
    problemId: string;
    liked: boolean;
    disliked: boolean;
    bookmarked: boolean;
    createdAt: Date;
    updatedAt: Date;
}
