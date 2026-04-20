import type { IClass } from '@recordings/interfaces/class.interface';
import { Schema, model } from 'mongoose';

const classSchema = new Schema<IClass>(
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
        groupId: {
            type: Schema.Types.ObjectId,
            ref: 'ClassGroup',
        },
        order: {
            type: Number,
            default: 0,
        },
        classType: {
            type: String,
            enum: [
                'GRE-Quant',
                'GRE-Verbal',
                'GRE-Writing',
                'GRE-General',
                'TOEFL',
                'IELTS',
                'Misc',
                'Other',
            ],
            required: true,
        },
        img: {
            type: String,
            trim: true,
        },
        thumbnailSize: {
            type: Number,
            enum: [3, 4, 6, 12],
            required: true,
        },
        plusOnly: {
            type: Boolean,
            default: false,
        },
        video: {
            type: String,
            trim: true,
        },
        homeworks: {
            type: String,
            trim: true,
            default: '',
        },
        resources: [
            {
                type: String,
                trim: true,
            },
        ],
    },
    {
        timestamps: true,
    }
);

const ClassModel = model<IClass>('Class', classSchema);
export default ClassModel;
