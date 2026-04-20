import mongoose, { Schema } from 'mongoose';
import type { IContent, IVideo, IMountainContent } from '@prepswift/interfaces/course.interface';

const VideoSchema = new Schema<IVideo>(
    {
        url: { type: String, required: false },
        embed_code: { type: String, default: '' },
        duration: { type: Number, required: true, default: 0 },
    },
    { _id: false }
);

const MountainContentSchema = new Schema<IMountainContent>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true },
        description: { type: String, default: '' },
    },
    { _id: false }
);

const ContentSchema = new Schema<IContent>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String, default: '' },
        plus_only: { type: Boolean, default: false },
        finalized: { type: Boolean, default: false },
        unlisted: { type: Boolean, default: false },
        video: { type: VideoSchema, required: true },
        associated_mountain_content: {
            type: MountainContentSchema,
            default: null,
            required: false,
        },
        categoryId: { type: Schema.Types.ObjectId, ref: 'PrepswiftCategory', required: true },
        courseId: { type: Schema.Types.ObjectId, ref: 'PrepswiftCourse', required: true },
        order: { type: Number, required: true, default: 0 },
    },
    { timestamps: true }
);

// Index for better query performance
ContentSchema.index({ categoryId: 1, courseId: 1 });
ContentSchema.index({ slug: 1 });

const PrepswiftContentModel = mongoose.model<IContent>('PrepswiftContent', ContentSchema);

export default PrepswiftContentModel;
