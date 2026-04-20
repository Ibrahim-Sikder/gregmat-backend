import type { Document, Types } from 'mongoose';

export interface IMountainContent {
    title: string;
    slug: string;
    description: string;
}

export interface IVideo {
    url?: string;
    embed_code?: string;
    duration: number;
}

export interface IContent extends Document {
    title: string;
    slug: string;
    description: string;
    plus_only: boolean;
    finalized: boolean;
    unlisted: boolean;
    video: IVideo;
    associated_mountain_content: IMountainContent | null;
    categoryId: Types.ObjectId;
    courseId: Types.ObjectId;
    order: number;
}

export interface ICategory extends Document {
    title: string;
    slug: string;
    description: string;
    courseId: Types.ObjectId;
}

export interface IPrepswiftCourse extends Document {
    title: string;
    slug: string;
    description: string;
    is_prepswift: boolean;
}

// Extended interfaces for populated data
export interface ICategoryWithContents extends ICategory {
    contents: IContent[];
}

export interface ICourseWithCategories extends IPrepswiftCourse {
    categories: ICategory[];
}

export interface ICourseWithFullData extends IPrepswiftCourse {
    categories: ICategoryWithContents[];
}
