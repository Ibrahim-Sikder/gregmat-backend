import type { ITest } from '@practice/interfaces/test.interface';
import mongoose, { Schema } from 'mongoose';

const TestSchema = new Schema<ITest>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        tagline: {
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
        description: {
            type: String,
        },
    },
    { timestamps: true }
);

const TestModel = mongoose.model<ITest>('Test', TestSchema);

export default TestModel;
