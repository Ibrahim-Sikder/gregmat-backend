import type { IPrompt, IEssay } from '@practice/interfaces/writeEssay.interface';
import mongoose from 'mongoose';

const promptSchema = new mongoose.Schema<IPrompt>(
    {
        body: {
            type: String,
            required: true,
        },
        promptType: {
            type: String,
            enum: ['Issue', 'Argument'],
            required: true,
        },
        accessType: {
            type: String,
            enum: ['Our Prompt', 'User Prompt'],
            default: 'Our Prompt',
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: function (this: any) {
                return this.accessType === 'User Prompt';
            },
        },
    },
    { timestamps: true }
);

promptSchema.index({ accessType: 1, userId: 1 });

const essaySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        promptId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Prompt',
            required: true,
        },
        promptBody: {
            type: String,
            required: true,
        },
        essayContent: {
            type: String,
            required: true,
        },
        wordCount: {
            type: Number,
            default: 0,
        },
        feedback: {
            score: { type: Number },
            wordCount: { type: Number },
            goodPoints: [
                {
                    point: { type: String },
                    description: { type: String },
                },
            ],
            areasForImprovement: [
                {
                    point: { type: String },
                    description: { type: String },
                },
            ],
            sectionFeedback: {
                introduction: [{ type: String }],
                bodyParagraph1: [{ type: String }],
                bodyParagraph2: [{ type: String }],
                conclusion: [{ type: String }],
            },
            summaryAndRecommendations: { type: String },
            suggestedScore: { type: String },
            estimatedTime: { type: String },
        },
    },
    { timestamps: true }
);

essaySchema.index({ userId: 1, createdAt: -1 });

export const PromptModel = mongoose.model<IPrompt>('Prompt', promptSchema);
export const EssayModel = mongoose.model<IEssay>('Essay', essaySchema);
