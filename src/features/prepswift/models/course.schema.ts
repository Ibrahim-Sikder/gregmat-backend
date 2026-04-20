import mongoose, { Schema } from 'mongoose';
import type { IPrepswiftCourse } from '@prepswift/interfaces/course.interface';

const CourseSchema = new Schema<IPrepswiftCourse>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        description: { type: String, default: '' },
        is_prepswift: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Index for better query performance
CourseSchema.index({ slug: 1 });

const PrepswiftCourseModel = mongoose.model<IPrepswiftCourse>('PrepswiftCourse', CourseSchema);

export default PrepswiftCourseModel;
