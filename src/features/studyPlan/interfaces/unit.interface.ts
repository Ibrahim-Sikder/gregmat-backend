import type { Document, Model } from 'mongoose';
import type { ObjectId } from 'mongodb';

export interface IUnit extends Document {
    _id: ObjectId | string;
    title: string;
    description: string;
    img?: string | null;
    plusOnly: boolean;
    twoSided: boolean;
    leftSideTitle?: string | null;
    leftSide?: string;
    rightSideTitle?: string | null;
    rightSide?: string;
    order?: number;
    section?: ObjectId | string;
}
