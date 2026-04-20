import type { ICourseSeries } from '@recordings/interfaces/series.interface';
import { Schema, model } from 'mongoose';

const seriesSchema = new Schema<ICourseSeries>(
    {
        title: {
            type: String,
            required: true,
            unique: true,
            trim: true,
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
        order: {
            type: Number,
            default: 0,
        },
        img: {
            type: String,
            trim: true,
        },
        courses: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Course',
            },
        ],
        isQuizSeries: {
            type: Boolean,
            default: false,
        },
        isAdmissionSeries: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const SeriesModel = model<ICourseSeries>('Series', seriesSchema);
export default SeriesModel;
