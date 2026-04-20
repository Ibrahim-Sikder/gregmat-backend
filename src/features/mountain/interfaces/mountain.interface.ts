import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export interface IColors {
    [key: string]: string;
}

export interface IMountainContent extends Document {
    title: string;
    slug: string;
    pronunciation?: string;
    tooltip?: string;
    description: string;
    plusOnly: boolean;
    finalized: boolean;
    unlisted: boolean;
    colors: IColors;
    mountainId: ObjectId;
    categoryId: ObjectId;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMountainCategory extends Document {
    title: string;
    slug: string;
    description?: string;
    mountainId: ObjectId;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMountain extends Document {
    title: string;
    tagline?: string;
    slug: string;
    description?: string;
    mountainType: 'vocab' | 'quant' | 'toefl' | 'other';
    isActive: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserMountainProgress extends Document {
    userId: ObjectId;
    contentId: ObjectId;
    colors: Map<string, string>;
    lastReviewed?: Date;
    reviewCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface IMountainContentWithProgress extends IMountainContent {
    userColors?: { [key: string]: string };
    userProgress?: IUserMountainProgress;
}
