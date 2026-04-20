import type { ISentenceSimplifyingPractice } from '@practice/interfaces/sentenceSimplifying.interface';
import mongoose, { Schema } from 'mongoose';

const SentenceSchema = new Schema(
    {
        id: {
            type: Number,
            required: true,
        },
        body: {
            type: String,
            required: true,
        },
        order_in_paragraph: {
            type: Number,
            required: true,
        },
        source: {
            type: String,
            required: true,
        },
        context: {
            type: [String],
            default: [],
        },
    },
    { _id: false }
);

const SentenceSimplifyingPracticeSchema = new Schema<ISentenceSimplifyingPractice>(
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
            enum: ['paragraph', 'random'],
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
        sentences: {
            type: [SentenceSchema],
            default: [],
        },
        attempted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const SentenceSimplifyingPracticeModel = mongoose.model<ISentenceSimplifyingPractice>(
    'SentenceSimplifyingPractice',
    SentenceSimplifyingPracticeSchema
);

export default SentenceSimplifyingPracticeModel;
