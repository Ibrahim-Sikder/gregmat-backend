import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import type { IUserProgress } from '@prepswift/interfaces/userProgress.interface';
import PrepswiftCourseModel from '@prepswift/models/course.schema';
import PrepswiftCategoryModel from '@prepswift/models/category.schema';
import PrepswiftContentModel from '@prepswift/models/content.schema';
import UserPrepswiftCourseProgress from '@prepswift/models/userProgress.schema';

class UserProgressService {
    private model = UserPrepswiftCourseProgress;

    private courseModel = PrepswiftCourseModel;

    private categoryModel = PrepswiftCategoryModel;

    private contentModel = PrepswiftContentModel;

    async markAsSaved(
        userId: string | undefined,
        courseId: string,
        categoryId: string,
        contentId: string
    ): Promise<IUserProgress> {
        // Verify course exists
        const course = await this.courseModel.findById(courseId);
        if (!course) {
            throw new BadRequestError('Course not found');
        }

        // Verify category exists
        const category = await this.categoryModel.findById(categoryId);
        if (!category) throw new BadRequestError('Category not found');

        // Verify content exists
        const content = await this.contentModel.findById(contentId);
        if (!content) throw new BadRequestError('Content not found');

        const existing = await this.model.findOne({ userId, courseId, categoryId, contentId });
        if (existing) {
            existing.saved = !existing.saved; // toggle
            existing.savedAt = new Date();
            await existing.save();
            return existing;
        }

        // If not found, create a new one with saved = true
        const progress = await this.model.create({
            userId,
            courseId,
            categoryId,
            contentId,
            saved: true,
            savedAt: new Date(),
            watched: false,
            courseTitle: course.title,
            categoriesTitle: category.title,
            contentTitle: content.title,
            videoUrl: content.video?.url || undefined,
        });

        return progress;
    }

    async markAsWatched(
        userId: string | undefined,
        courseId: string,
        categoryId: string,
        contentId: string,
        watchProgress: number = 100,
        lastWatchedPosition: number = 0
    ): Promise<IUserProgress> {
        const existing = await this.model.findOne({ userId, courseId, categoryId, contentId });

        if (existing) {
            existing.watched = !existing.watched; // toggle
            existing.watchedAt = new Date();
            existing.watchProgress = Math.min(100, Math.max(0, watchProgress));
            existing.lastWatchedPosition = Math.max(0, lastWatchedPosition);

            await existing.save();
            return existing;
        }

        // Verify course exists
        const course = await this.courseModel.findById(courseId);
        if (!course) {
            throw new BadRequestError('Course not found');
        }

        // Verify category exists
        const category = await this.categoryModel.findById(categoryId);
        if (!category) throw new BadRequestError('Category not found');

        // Verify content exists
        const content = await this.contentModel.findById(contentId);
        if (!content) throw new BadRequestError('Content not found');

        // If not found, create a new one with watched = true
        const newProgress = await this.model.create({
            userId,
            courseId,
            categoryId,
            contentId,
            watched: true,
            watchedAt: new Date(),
            watchProgress: Math.min(100, Math.max(0, watchProgress)),
            lastWatchedPosition: Math.max(0, lastWatchedPosition),
            saved: false,
            courseTitle: course.title,
            categoriesTitle: category.title,
            contentTitle: content.title,
            videoUrl: content.video?.url || undefined,
        });

        return newProgress;
    }

    async updateWatchProgress(
        userId: string | undefined,
        courseId: string,
        categoryId: string,
        contentId: string,
        watchProgress: number,
        lastWatchedPosition: number
    ): Promise<IUserProgress> {
        const updateData: any = {
            watchProgress: Math.min(100, Math.max(0, watchProgress)),
            lastWatchedPosition: Math.max(0, lastWatchedPosition),
        };

        // Auto-mark as watched if progress >= 90%
        if (watchProgress >= 90) {
            updateData.watched = true;
            updateData.watchedAt = new Date();
        }

        const progress = await this.model.findOneAndUpdate(
            { userId, courseId, categoryId, contentId },
            updateData,
            { new: true, upsert: true }
        );

        return progress;
    }

    async removeSaved(
        userId: string | undefined,
        courseId: string,
        categoryId: string,
        contentId: string
    ): Promise<IUserProgress | null> {
        return await this.model.findOneAndUpdate(
            { userId, courseId, categoryId, contentId },
            { saved: false, $unset: { savedAt: 1 } },
            { new: true }
        );
    }

    async getUserProgress(userId: string, courseId: string): Promise<IUserProgress[]> {
        if (!Helpers.isValidObjectId(userId) || !Helpers.isValidObjectId(courseId)) {
            throw new BadRequestError('Invalid ID provided');
        }

        return await this.model.find({ userId, courseId });
    }

    async getUserProgressForContent(
        userId: string | undefined,
        courseId: string,
        categoryId: string,
        contentId: string
    ): Promise<IUserProgress | null> {
        return await this.model.findOne({ userId, courseId, categoryId, contentId });
    }

    async getSavedContents(userId: string, courseId?: string): Promise<IUserProgress[]> {
        const query: any = { userId, saved: true };
        if (courseId && Helpers.isValidObjectId(courseId)) {
            query.courseId = courseId;
        }

        const data = await this.model.find(query);
        return this.groupContentsByCategory(data);
    }

    async getWatchedContents(userId: string, courseId?: string): Promise<IUserProgress[]> {
        const query: any = { userId, watched: true };
        if (courseId && Helpers.isValidObjectId(courseId)) {
            query.courseId = courseId;
        }

        return await this.model.find(query).populate([
            {
                path: 'contentId',
                select: 'title slug',
            },
        ]);
    }

    async groupContentsByCategory(contents: IUserProgress[]): Promise<any[]> {
        const groups: any[] = [];
        const categoryMap: Record<string, number> = {}; // Maps categoryId to index in groups array

        contents.forEach((content) => {
            const categoryId = content.categoryId as any as string;

            // If category hasn't been encountered before, create a new group
            if (!(categoryId in categoryMap)) {
                const newGroup: any = {
                    categoryId,
                    categoryTitle: content.categoriesTitle,
                    contents: [],
                };
                groups.push(newGroup);
                categoryMap[categoryId] = groups.length - 1; // Store index of new group
            }

            // Add content to the appropriate category group
            const groupIndex = categoryMap[categoryId];
            groups[groupIndex].contents.push(content);
        });

        return groups;
    }
}

const userProgressService = new UserProgressService();
export default userProgressService;
