import mongoose, { Schema } from 'mongoose';
import type { IUserProgress } from '@prepswift/interfaces/userProgress.interface';

const UserProgressSchema = new Schema<IUserProgress>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        courseId: { type: Schema.Types.ObjectId, ref: 'PrepswiftCourse', required: true },
        categoryId: { type: Schema.Types.ObjectId, required: true },
        contentId: { type: Schema.Types.ObjectId, required: true },
        saved: { type: Boolean, default: false },
        watched: { type: Boolean, default: false },
        watchedAt: { type: Date },
        savedAt: { type: Date },
        watchProgress: { type: Number, min: 0, max: 100, default: 0 },
        lastWatchedPosition: { type: Number, min: 0, default: 0 },
        courseTitle: { type: String },
        categoriesTitle: { type: String },
        contentTitle: { type: String },
        videoUrl: { type: String },
    },
    { timestamps: true }
);

// Compound index to ensure one progress record per user-content combination
UserProgressSchema.index({ userId: 1, courseId: 1, categoryId: 1, contentId: 1 }, { unique: true });

// Index for efficient queries
UserProgressSchema.index({ userId: 1, courseId: 1 });
UserProgressSchema.index({ userId: 1, saved: 1 });
UserProgressSchema.index({ userId: 1, watched: 1 });

const UserPrepswiftCourseProgress = mongoose.model<IUserProgress>(
    'UserPrepswiftCourseProgress',
    UserProgressSchema
);

export default UserPrepswiftCourseProgress;
