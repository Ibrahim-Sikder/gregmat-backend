import type {
    IMountain,
    IMountainCategory,
    IMountainContent,
    IUserMountainProgress,
    IMountainContentWithProgress,
} from '@mountain/interfaces/mountain.interface';
import {
    Mountain,
    MountainCategory,
    MountainContent,
    UserMountainProgress,
} from '@mountain/models';
import { BadRequestError } from '@global/helpers/error-handlers';
import type { FilterQuery, QueryOptions, UpdateQuery } from 'mongoose';

interface PaginationQuery {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    plusOnly?: string;
    finalized?: string;
    unlisted?: string;
}

class MountainService {
    // Mountain CRUD operations
    public async createMountain(mountainData: Partial<IMountain>): Promise<IMountain> {
        const existingMountain = await Mountain.findOne({ slug: mountainData.slug });
        if (existingMountain) {
            throw new BadRequestError('Mountain with this slug already exists');
        }

        const mountain = new Mountain(mountainData);
        return await mountain.save();
    }

    public async getAllMountains(): Promise<IMountain[]> {
        const mountains = await Mountain.find()
            .sort()
            .lean()
            .select('title slug tagline mountainType');

        return mountains;
    }

    public async getMountainById(id: string): Promise<IMountain | null> {
        const mountain = await Mountain.findById(id);
        if (!mountain) {
            throw new BadRequestError('Mountain not found');
        }
        return mountain;
    }

    public async updateMountain(
        id: string,
        updateData: UpdateQuery<IMountain>
    ): Promise<IMountain | null> {
        const mountain = await Mountain.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });
        if (!mountain) {
            throw new BadRequestError('Mountain not found');
        }
        return mountain;
    }

    public async deleteMountain(id: string): Promise<void> {
        // Check if mountain has categories or content
        const [categoriesCount, contentCount] = await Promise.all([
            MountainCategory.countDocuments({ mountainId: id }),
            MountainContent.countDocuments({ mountainId: id }),
        ]);

        if (categoriesCount > 0 || contentCount > 0) {
            throw new BadRequestError(
                'Cannot delete mountain that has categories or content. Delete them first.'
            );
        }

        const mountain = await Mountain.findByIdAndDelete(id);
        if (!mountain) {
            throw new BadRequestError('Mountain not found');
        }
    }

    // Mountain Category CRUD operations
    public async createMountainCategory(
        categoryData: Partial<IMountainCategory>
    ): Promise<IMountainCategory> {
        // Check if mountain exists
        await this.getMountainById(categoryData.mountainId?.toString() || '');

        const existingCategory = await MountainCategory.findOne({
            slug: categoryData.slug,
            mountainId: categoryData.mountainId,
        });

        if (existingCategory) {
            throw new BadRequestError('Category with this slug already exists in this mountain');
        }

        const category = new MountainCategory(categoryData);
        return await category.save();
    }

    public async getCategoriesByMountain(
        mountainId: string,
        query: any = {}
    ): Promise<IMountainCategory[]> {
        const filter: FilterQuery<IMountainCategory> = { mountainId };

        if (query.search) {
            filter.$or = [
                { title: { $regex: query.search, $options: 'i' } },
                { description: { $regex: query.search, $options: 'i' } },
            ];
        }

        return (await MountainCategory.find(filter)
            .sort({ order: 1, createdAt: -1 })
            .lean()) as IMountainCategory[];
    }

    public async getMountainCategoryById(id: string): Promise<IMountainCategory | null> {
        const category = await MountainCategory.findById(id).populate('mountainId');
        if (!category) {
            throw new BadRequestError('Mountain category not found');
        }
        return category;
    }

    public async updateMountainCategory(
        id: string,
        updateData: UpdateQuery<IMountainCategory>
    ): Promise<IMountainCategory | null> {
        const category = await MountainCategory.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });
        if (!category) {
            throw new BadRequestError('Mountain category not found');
        }
        return category;
    }

    public async deleteMountainCategory(id: string): Promise<void> {
        // Check if category has content
        const contentCount = await MountainContent.countDocuments({ categoryId: id });

        if (contentCount > 0) {
            throw new BadRequestError(
                'Cannot delete category that has content. Delete content first.'
            );
        }

        const category = await MountainCategory.findByIdAndDelete(id);
        if (!category) {
            throw new BadRequestError('Mountain category not found');
        }
    }

    // Mountain Content CRUD operations
    public async createMountainContent(
        contentData: Partial<IMountainContent>
    ): Promise<IMountainContent> {
        // Check if mountain and category exist
        await Promise.all([
            this.getMountainById(contentData.mountainId?.toString() || ''),
            this.getMountainCategoryById(contentData.categoryId?.toString() || ''),
        ]);

        const existingContent = await MountainContent.findOne({
            slug: contentData.slug,
            mountainId: contentData.mountainId,
        });

        if (existingContent) {
            throw new BadRequestError('Content with this slug already exists in this mountain');
        }

        const content = new MountainContent(contentData);
        return await content.save();
    }

    public async getContentByCategory(
        categoryId: string,
        query: any = {}
    ): Promise<IMountainContent[]> {
        const filter: FilterQuery<IMountainContent> = { categoryId };

        if (query.search) {
            filter.$or = [
                { title: { $regex: query.search, $options: 'i' } },
                { description: { $regex: query.search, $options: 'i' } },
            ];
        }

        if (query.plusOnly !== undefined) {
            filter.plusOnly = query.plusOnly === 'true';
        }

        if (query.finalized !== undefined) {
            filter.finalized = query.finalized === 'true';
        }

        if (query.unlisted !== undefined) {
            filter.unlisted = query.unlisted === 'true';
        }

        return (await MountainContent.find(filter)
            .populate('categoryId')
            .populate('mountainId')
            .sort({ order: 1, createdAt: -1 })
            .lean()) as IMountainContent[];
    }

    public async getContentByMountain(
        mountainId: string,
        query: any = {}
    ): Promise<IMountainContent[]> {
        const filter: FilterQuery<IMountainContent> = { mountainId };

        if (query.categoryId) {
            filter.categoryId = query.categoryId;
        }

        if (query.search) {
            filter.$or = [
                { title: { $regex: query.search, $options: 'i' } },
                { description: { $regex: query.search, $options: 'i' } },
            ];
        }

        if (query.plusOnly !== undefined) {
            filter.plusOnly = query.plusOnly === 'true';
        }

        if (query.finalized !== undefined) {
            filter.finalized = query.finalized === 'true';
        }

        if (query.unlisted !== undefined) {
            filter.unlisted = query.unlisted === 'true';
        }

        return (await MountainContent.find(filter)
            .populate('categoryId')
            .populate('mountainId')
            .sort({ order: 1, createdAt: -1 })
            .lean()) as IMountainContent[];
    }

    public async getMountainContentById(id: string): Promise<IMountainContent | null> {
        const content = await MountainContent.findById(id)
            .populate('mountainId')
            .populate('categoryId');
        if (!content) {
            throw new BadRequestError('Mountain content not found');
        }
        return content;
    }

    public async updateMountainContent(
        id: string,
        updateData: UpdateQuery<IMountainContent>
    ): Promise<IMountainContent | null> {
        const content = await MountainContent.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        })
            .populate('mountainId')
            .populate('categoryId');

        if (!content) {
            throw new BadRequestError('Mountain content not found');
        }
        return content;
    }

    public async deleteMountainContent(id: string): Promise<void> {
        const content = await MountainContent.findByIdAndDelete(id);
        if (!content) {
            throw new BadRequestError('Mountain content not found');
        }
    }

    public async getMountainDetails(
        slug: string,
        userId: string,
        query: PaginationQuery = {}
    ): Promise<any> {
        const mountain = await Mountain.findOne({ slug }).lean();
        if (!mountain) {
            throw new BadRequestError('Mountain not found');
        }

        // Category pagination setup
        const categoryPage = Math.max(1, parseInt(query.page?.toString() || '1'));
        const categoryLimit = Math.min(50, Math.max(1, parseInt(query.limit?.toString() || '1')));

        // Calculate cumulative limit (all items from page 1 to current page)
        const cumulativeLimit = categoryPage * categoryLimit;

        // Get total count of categories for pagination
        const totalCategories = await MountainCategory.countDocuments({ mountainId: mountain._id });
        const totalCategoryPages = Math.ceil(totalCategories / categoryLimit);

        // Get ALL categories from page 1 to current page
        const categories = await MountainCategory.find({ mountainId: mountain._id })
            .sort({ order: 1, createdAt: 1 })
            .limit(cumulativeLimit)
            .lean();

        // If no categories found, return empty result
        if (categories.length === 0) {
            return {
                _id: mountain._id.toString(),
                title: mountain.title,
                slug: mountain.slug,
                description: mountain.description,
                tagline: (mountain as any).tagline,
                mountain_categories: [],
                pagination: {
                    currentPage: categoryPage,
                    totalPages: totalCategoryPages,
                    totalItems: totalCategories,
                    itemsPerPage: categoryLimit,
                    hasNextPage: categoryPage < totalCategoryPages,
                    hasPrevPage: categoryPage > 1,
                },
            };
        }

        // Extract category IDs for ALL loaded categories
        const categoryIds = categories.map((c) => c._id);

        // Build content filter - for all categories loaded so far
        const contentFilter: FilterQuery<IMountainContent> = {
            mountainId: mountain._id,
            categoryId: { $in: categoryIds },
        };

        // Apply additional filters if provided
        if (query.search) {
            contentFilter.$or = [
                { title: { $regex: query.search, $options: 'i' } },
                { description: { $regex: query.search, $options: 'i' } },
            ];
        }

        if (query.plusOnly !== undefined) {
            contentFilter.plusOnly = query.plusOnly === 'true';
        }

        if (query.finalized !== undefined) {
            contentFilter.finalized = query.finalized === 'true';
        }

        if (query.unlisted !== undefined) {
            contentFilter.unlisted = query.unlisted === 'true';
        }

        // Get all contents for ALL loaded categories
        const contents = await MountainContent.find(contentFilter)
            .sort({ order: 1, createdAt: 1 })
            .lean();

        // Get user progress if userId is provided
        let progressMap = new Map();
        if (userId && contents.length > 0) {
            const contentIds = contents.map((c) => c._id);
            const progress = await UserMountainProgress.find({
                userId,
                contentId: { $in: contentIds },
            }).lean();

            progressMap = new Map(progress.map((p) => [p.contentId.toString(), p]));
        }

        // Group contents by category
        const contentsByCategory = contents.reduce(
            (acc, content) => {
                const categoryId = content.categoryId.toString();
                if (!acc[categoryId]) {
                    acc[categoryId] = [];
                }

                const userProgress = progressMap.get(content._id.toString());

                // Convert Map to plain object for userColors
                let userColors = {};
                if (userProgress?.colors) {
                    if (userProgress.colors instanceof Map) {
                        userColors = Object.fromEntries(userProgress.colors);
                    } else {
                        userColors = userProgress.colors || {};
                    }
                }

                const contentItem: any = {
                    _id: content._id.toString(),
                    title: content.title,
                    slug: content.slug,
                    pronunciation: content.pronunciation,
                    tooltip: content.tooltip,
                    description: content.description,
                    plus_only: content.plusOnly,
                    finalized: content.finalized,
                    unlisted: content.unlisted,
                    colors: userColors,
                    order: content.order,
                };

                acc[categoryId].push(contentItem);
                return acc;
            },
            {} as Record<string, any[]>
        );

        // Get total content count per category (for all loaded categories)
        const categoryContentCounts = await MountainContent.aggregate([
            { $match: { mountainId: mountain._id, categoryId: { $in: categoryIds } } },
            { $group: { _id: '$categoryId', count: { $sum: 1 } } },
        ]);

        const contentCountMap = new Map(
            categoryContentCounts.map((item) => [item._id.toString(), item.count])
        );

        return {
            _id: mountain._id.toString(),
            title: mountain.title,
            slug: mountain.slug,
            description: mountain.description,
            tagline: (mountain as any).tagline,
            mountain_categories: categories.map((category) => ({
                _id: category._id.toString(),
                title: category.title,
                slug: category.slug,
                description: category.description || '',
                order: category.order,
                totalContents: contentCountMap.get(category._id.toString()) || 0,
                mountain_contents: contentsByCategory[category._id.toString()] || [],
            })),
            pagination: {
                currentPage: categoryPage,
                totalPages: totalCategoryPages,
                totalItems: totalCategories,
                itemsPerPage: categoryLimit,
                hasNextPage: categoryPage < totalCategoryPages,
                hasPrevPage: categoryPage > 1,
                loadedItems: categories.length, // Total items loaded so far
            },
        };
    }

    // User Progress methods
    public async updateUserContentColors(
        userId: string,
        contentId: string,
        color: string
    ): Promise<IUserMountainProgress> {
        // Validate content exists
        await this.getMountainContentById(contentId);

        // Get current progress
        let progress = await UserMountainProgress.findOne({ userId, contentId });

        if (!progress) {
            // create new doc if not exists
            progress = new UserMountainProgress({
                userId,
                contentId,
                colors: new Map(),
                reviewCount: 0,
                lastReviewed: new Date(),
            });
        }

        // Convert Map to Object (for easier handling)
        const colorsObj = progress.colors ? Object.fromEntries(progress.colors) : {};
        const nextIndex = Object.keys(colorsObj).length;

        // Add new color
        colorsObj[nextIndex] = color;

        // Save updated values
        progress.colors = new Map(Object.entries(colorsObj));
        progress.reviewCount = (progress.reviewCount || 0) + 1;
        progress.lastReviewed = new Date();

        await progress.save();

        return progress;
    }

    async resetUserContentColors(userId: string, contentId: string): Promise<void> {
        const progress = await UserMountainProgress.findOne({ userId, contentId });

        if (progress) {
            progress.colors = new Map();
            progress.reviewCount = 0;
            progress.lastReviewed = new Date();
            await progress.save();
        }

        return;
    }

    async resetUserAllColorsInMountain(userId: string, mountainId: string): Promise<void> {
        // Get all content IDs in the mountain
        const contents = await MountainContent.find({ mountainId }).select('_id').lean();
        const contentIds = contents.map((c) => c._id);

        // Update all progress documents for the user and these content IDs
        await UserMountainProgress.updateMany(
            { userId, contentId: { $in: contentIds } },
            {
                $set: {
                    colors: new Map(),
                    reviewCount: 0,
                    lastReviewed: new Date(),
                },
            }
        );

        return;
    }

    async resetUsersColorsByCategory(userIds: string[], categoryId: string): Promise<void> {
        // Get all content IDs in the category
        const contents = await MountainContent.find({ categoryId }).select('_id').lean();
        const contentIds = contents.map((c) => c._id);

        // Update all progress documents for the users and these content IDs
        await UserMountainProgress.updateMany(
            { userId: { $in: userIds }, contentId: { $in: contentIds } },
            {
                $set: {
                    colors: new Map(),
                    reviewCount: 0,
                    lastReviewed: new Date(),
                },
            }
        );

        return;
    }
}

const mountainService = new MountainService();
export default mountainService;
