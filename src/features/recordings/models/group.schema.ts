import type { IClassGroup } from '@recordings/interfaces/group.interface';
import { Schema, model } from 'mongoose';

const classGroupSchema = new Schema<IClassGroup>(
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
        courseId: {
            type: Schema.Types.ObjectId,
            ref: 'Course',
            required: true,
        },
        order: {
            type: Number,
            default: 0,
        },
        img: {
            type: String,
            trim: true,
        },
        classes: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Class',
            },
        ],
    },
    {
        timestamps: true,
    }
);

const ClassGroupModel = model<IClassGroup>('ClassGroup', classGroupSchema);
export default ClassGroupModel;
