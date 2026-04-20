import mongoose, { Schema } from 'mongoose';
import type { ICategory } from '@prepswift/interfaces/course.interface';

const CategorySchema = new Schema<ICategory>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String, default: '' },
        courseId: { type: Schema.Types.ObjectId, ref: 'PrepswiftCourse', required: true },
    },
    { timestamps: true }
);

// Index for better query performance
CategorySchema.index({ courseId: 1 });
CategorySchema.index({ slug: 1 });

const PrepswiftCategoryModel = mongoose.model<ICategory>('PrepswiftCategory', CategorySchema);

export default PrepswiftCategoryModel;
