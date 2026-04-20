import type { IContent } from '@prepswift/interfaces/course.interface';
import PrepswiftContentModel from '@prepswift/models/content.schema';
import type { PrepswiftContent } from '@prepswift/schemas/content';
import userProgressService from '@service/db/userProgress.service';
import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import withTransaction from '@global/helpers/withTransaction';

class PrepswiftContentService {
    private model = PrepswiftContentModel;

    async create(data: PrepswiftContent): Promise<IContent> {
        return await withTransaction(async (session) => {
            const slug = data.slug || Helpers.slugify(data.title);

            // Check if content with same slug exists
            const existingContent = await this.model.findOne({ slug });
            if (existingContent) {
                throw new BadRequestError('Content with this slug already exists');
            }

            const content = new this.model({
                ...data,
                slug,
            });

            return await content.save({ session });
        });
    }

    async getById(id: string, userId?: string): Promise<IContent | null> {
        const content = await this.model.findById(id);
        if (!content) {
            throw new BadRequestError('Content not found');
        }

        // If userId is provided, merge user progress data
        if (userId && Helpers.isValidObjectId(userId)) {
            return await this.mergeUserProgress(content, userId);
        }

        return content;
    }

    async getBySlug(slug: string, userId?: string): Promise<IContent | null> {
        const content = await this.model.findOne({ slug });
        if (!content) {
            throw new BadRequestError('Content not found');
        }

        // If userId is provided, merge user progress data
        if (userId && Helpers.isValidObjectId(userId)) {
            return await this.mergeUserProgress(content, userId);
        }

        return content;
    }

    async getContentWithNavigation(contentId: string, userId?: string): Promise<any> {
        const isValidId = Helpers.isValidObjectId(contentId);
        const query = isValidId ? { _id: contentId } : { slug: contentId };

        const currentContent = await this.model.findOne(query).lean();
        if (!currentContent) {
            throw new BadRequestError('Content not found');
        }

        // Get all contents in the same category, sorted by creation date
        const allContents = await this.model
            .find({ categoryId: currentContent.categoryId })
            .sort({ order: 1 })
            .select('_id title slug')
            .lean();

        // Find the index of the current content
        const index = allContents.findIndex(
            (content: any) => content._id.toString() === currentContent._id.toString()
        );

        // Merge user progress if userId is provided
        let currentContentWithProgress = currentContent;
        if (userId && Helpers.isValidObjectId(userId)) {
            const contentDoc = await this.model.findById(currentContent._id);
            if (contentDoc) {
                currentContentWithProgress = await this.mergeUserProgress(contentDoc, userId);
            }
        }

        return {
            current: currentContentWithProgress,
            prev: index > 0 ? allContents[index - 1] : null,
            next: index < allContents.length - 1 ? allContents[index + 1] : null,
        };
    }

    async getByCategoryId(categoryId: string, userId?: string): Promise<IContent[]> {
        if (!Helpers.isValidObjectId(categoryId)) {
            throw new BadRequestError('Invalid category ID');
        }

        const contents = await this.model.find({ categoryId }).sort({ order: 1 });

        // If userId is provided, merge user progress data for all contents
        if (userId && Helpers.isValidObjectId(userId)) {
            return await Promise.all(
                contents.map((content) => this.mergeUserProgress(content, userId))
            );
        }

        return contents;
    }

    async getByCourseId(courseId: string, userId?: string): Promise<IContent[]> {
        if (!Helpers.isValidObjectId(courseId)) {
            throw new BadRequestError('Invalid course ID');
        }

        const contents = await this.model.find({ courseId }).sort({ createdAt: 1 });

        // If userId is provided, merge user progress data for all contents
        if (userId && Helpers.isValidObjectId(userId)) {
            return await Promise.all(
                contents.map((content) => this.mergeUserProgress(content, userId))
            );
        }

        return contents;
    }

    async getAll(
        query: Record<string, any>,
        page = 1,
        limit = 20,
        search = ''
    ): Promise<{
        data: IContent[];
        meta: { limit: number; page: number; total: number; totalPage: number };
    }> {
        const skip = (page - 1) * limit;

        // Build search query
        const searchQuery = search ? { ...query, title: { $regex: search, $options: 'i' } } : query;

        const total = await this.model.countDocuments(searchQuery);
        const contents = await this.model
            .find(searchQuery)
            .sort({ order: 1 })
            .skip(skip)
            .limit(limit);

        return {
            data: contents,
            meta: {
                limit,
                page,
                total,
                totalPage: Math.ceil(total / limit),
            },
        };
    }

    async update(id: string, data: Partial<PrepswiftContent>): Promise<IContent | null> {
        const content = await this.model.findById(id);
        if (!content) {
            throw new BadRequestError('Content not found');
        }

        const updateData = { ...data };

        return await this.model.findByIdAndUpdate(id, updateData, { new: true });
    }

    async delete(id: string): Promise<IContent | null> {
        return await withTransaction(async (session) => {
            const content = await this.model.findByIdAndDelete(id, { session });
            if (!content) {
                throw new BadRequestError('Content not found');
            }
            return content;
        });
    }

    async bulkCreate(contents: PrepswiftContent[]): Promise<IContent[]> {
        return await withTransaction(async (session) => {
            const processedContents = contents.map((content) => ({
                ...content,
                slug: content.slug || Helpers.slugify(content.title),
            }));

            return await this.model.insertMany(processedContents, { session });
        });
    }

    async deleteByCategoryId(categoryId: string): Promise<void> {
        await withTransaction(async (session) => {
            await this.model.deleteMany({ categoryId }, { session });
        });
    }

    async deleteByCourseId(courseId: string): Promise<void> {
        await withTransaction(async (session) => {
            await this.model.deleteMany({ courseId }, { session });
        });
    }

    private async mergeUserProgress(content: IContent, userId: string): Promise<any> {
        const contentObj = content.toObject();
        const courseId = content.courseId.toString();
        const categoryId = content.categoryId.toString();
        const contentId = (content._id as any).toString();

        const userProgress = await userProgressService.getUserProgress(userId, courseId);

        // Find progress for this specific content
        const progress = userProgress.find(
            (p) => p.categoryId.toString() === categoryId && p.contentId.toString() === contentId
        );

        return {
            ...contentObj,
            saved: progress?.saved || false,
            watched: progress?.watched || false,
            watchProgress: progress?.watchProgress || 0,
            lastWatchedPosition: progress?.lastWatchedPosition || 0,
            watchedAt: progress?.watchedAt || null,
            savedAt: progress?.savedAt || null,
        };
    }
}

const prepswiftContentService = new PrepswiftContentService();
export default prepswiftContentService;
