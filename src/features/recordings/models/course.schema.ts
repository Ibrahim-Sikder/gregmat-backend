import type { ICourse } from '@recordings/interfaces/course.interface';
import { Schema, model } from 'mongoose';

const courseSchema = new Schema<ICourse>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        seriesId: {
            type: Schema.Types.ObjectId,
            ref: 'Series',
            required: true,
        },
        order: {
            type: Number,
            default: 0,
        },
        thumbnailSize: {
            type: Number,
            enum: [3, 4, 6, 12],
            required: true,
        },
        img: {
            type: String,
            trim: true,
        },
        banner: {
            type: String,
            trim: true,
        },
        groups: [
            {
                type: Schema.Types.ObjectId,
                ref: 'ClassGroup',
            },
        ],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

const CourseModel = model<ICourse>('Course', courseSchema);
export default CourseModel;
