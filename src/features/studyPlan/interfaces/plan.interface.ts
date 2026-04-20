import type { Document, Model } from 'mongoose';
import type { ObjectId } from 'mongodb';
import type { IUnit } from '@studyPlan/interfaces/unit.interface';

export interface IStudyPlan extends Document {
    _id: ObjectId | string;
    title: string;
    tagline: string;
    description: string;
    slug: string;
    img?: string | null;
    img2?: string | null;
    sections: ObjectId[] | IUnit[];
    plusOnly: boolean;
    createdAt: Date;
    updatedAt: Date;
}
