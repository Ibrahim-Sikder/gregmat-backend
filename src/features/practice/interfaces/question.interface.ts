import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export interface IChoice {
    id: number;
    order: number;
    title: string;
    body: string;
    choice_group: number;
}

export interface IChoiceGroup {
    title: string;
    choices: IChoice[];
}

export interface IAnswerAttempt {
    answered_at: Date;
    correct: boolean;
    first: boolean;
}

export interface IUserQuestionProgress extends Document {
    userId: ObjectId;
    questionSlug: string;
    status: 'ToDo' | 'Attempted' | 'Solved';
    userAnswerAttempts: IAnswerAttempt[];
    bookmarked: boolean;
    liked: boolean;
    disliked: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface IQuestion extends Document {
    slug: string;
    title: string;
    browserTitle: string;
    shortMeta: string;
    type:
        | 'Quantitative Comparison'
        | 'Numeric Entry (Not Fraction)'
        | 'Multiple Choice'
        | 'Multiple Select';
    superCategory: 'Quant' | 'Verbal';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    dynamicDifficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
    body: string;
    answerData: any;
    choiceGroups: IChoiceGroup[];
    plusOnly: boolean;
    acceptance: number;
    likes: string;
    maxScore: number;
    source: string | null;
    hasSolutionVideo: boolean;
    solutionHasVideo: boolean;
    leftSideText: string | null;
    createdAt: Date;
    listedAt: Date | null;
}
