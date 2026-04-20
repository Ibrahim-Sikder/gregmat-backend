import type { IParagraphDocument } from '@practice/interfaces/main-idea.interface';
import mongoose, { Schema } from 'mongoose';

const SentenceSchema = new Schema(
    {
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
            type: String,
            default: null,
        },
    },
    { _id: false }
);

const ParagraphSchema = new Schema<IParagraphDocument>(
    {
        mainIdeaPractice: {
            type: Schema.Types.ObjectId,
            ref: 'MainIdeaPractice',
            required: true,
            index: true,
        },
        order_in_passage: {
            type: Number,
            required: true,
        },
        body: {
            type: String,
            required: true,
        },
        sentences: {
            type: [SentenceSchema],
            default: [],
        },
        main_idea: {
            type: String,
            required: true,
        },
        passage_source: {
            type: String,
            required: true,
        },
        context: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const ParagraphModel = mongoose.model<IParagraphDocument>('Paragraph', ParagraphSchema);

export default ParagraphModel;
