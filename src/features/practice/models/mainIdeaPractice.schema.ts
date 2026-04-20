import type { IMainIdeaPractice } from '@practice/interfaces/main-idea.interface';
import mongoose, { Schema } from 'mongoose';

const MainIdeaPracticeSchema = new Schema<IMainIdeaPractice>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        mode: {
            type: String,
            enum: ['paragraph', 'Passage'],
            required: true,
            default: 'paragraph',
        },
        user_generated: {
            type: Boolean,
            default: false,
        },
        count: {
            type: Number,
            default: 0,
        },
        paragraphs: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Paragraph',
            },
        ],
        attempted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const MainIdeaPracticeModel = mongoose.model<IMainIdeaPractice>(
    'MainIdeaPractice',
    MainIdeaPracticeSchema
);

export default MainIdeaPracticeModel;
