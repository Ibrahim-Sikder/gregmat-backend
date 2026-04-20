export interface IPrompt {
    id: number;
    body: string;
    promptType: 'Issue' | 'Argument';
    accessType: 'Our Prompt' | 'User Prompt';
    userId?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IEssay {
    _id?: string;
    userId: string;
    promptId: string;
    promptBody: string;
    essayContent: string;
    wordCount: number;
    feedback?: IFeedback;
    createdAt: Date;
    updatedAt: Date;
}

export interface GenerateEssayRequest {
    promptId: string;
    promptBody: string;
    userId: string;
    additionalInstructions?: string;
}

export interface GenerateEssayResponse {
    success: boolean;
    essay?: string;
    wordCount?: number;
    error?: string;
}

export interface FeedbackPoint {
    point: string;
    description: string;
}

export interface SectionFeedback {
    introduction: string[];
    bodyParagraph1: string[];
    bodyParagraph2: string[];
    conclusion: string[];
}

export interface IFeedback {
    score: number;
    wordCount: number;
    goodPoints: FeedbackPoint[];
    areasForImprovement: FeedbackPoint[];
    sectionFeedback: SectionFeedback;
    summaryAndRecommendations: string;
    suggestedScore: string;
    estimatedTime?: string;
}
