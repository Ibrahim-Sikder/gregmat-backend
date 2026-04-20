import { SupportContrastModel } from '@practice/models/supportContrast.schema';
import { SupportContrastAttemptModel } from '@practice/models/supportContrastAttempt.schema';
import type {
    ISupportContrast,
    ISupportContrastAttempt,
} from '@practice/interfaces/supportContrast.interface';
import mongoose, { type PipelineStage } from 'mongoose';
import slugify from 'slugify';

class SupportContrastService {
    public async createSupportContrast(data: any): Promise<ISupportContrast> {
        if (!data.slug && data.title) {
            data.slug = slugify(data.title, { lower: true, strict: true });
        }
        return SupportContrastModel.create(data);
    }

    public async getSupportContrasts(
        userId: string,
        query: { page?: number; limit?: number; search?: string; sort?: string }
    ): Promise<{ data: any[]; meta: any }> {
        const { page = 1, limit = 50, search, sort } = query;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const matchStage: any = {};
        if (search) {
            matchStage.$or = [
                { title: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } },
                { text: { $regex: search, $options: 'i' } },
            ];
        }

        let sortStage: any = { _id: 1 }; // Default sort
        if (sort === 'newest') {
            sortStage = { createdAt: -1 };
        } else if (sort === 'oldest') {
            sortStage = { createdAt: 1 };
        } else if (sort === 'hardest') {
            sortStage = { acceptance: 1 };
        } else if (sort === 'easiest') {
            sortStage = { acceptance: -1 };
        }

        const pipeline: PipelineStage[] = [
            { $match: matchStage },
            { $sort: sortStage },
            {
                $lookup: {
                    from: 'supportcontrastattempts',
                    let: { supportContrastId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$support_contrast', '$$supportContrastId'] },
                                        { $eq: ['$user', new mongoose.Types.ObjectId(userId)] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'my_attempts',
                },
            },
            {
                $facet: {
                    data: [{ $skip: skip }, { $limit: limitNum }],
                    totalCount: [{ $count: 'count' }],
                },
            },
        ];

        const result = await SupportContrastModel.aggregate(pipeline);
        const data = result[0].data || [];
        const total = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;

        // Get user stats for all SupportContrasts
        const stats = await SupportContrastAttemptModel.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    score: { $sum: { $cond: [{ $eq: ['$correct', true] }, 1, 0] } },
                    attemptedAtLeastOnce: { $sum: 1 }, // This counts total documents, but we should count unique (user, question, blank)
                },
            },
        ]);

        // Actually, we want unique attempts per (user, support_contrast, blank_index)
        // But the attempt logic creates a new doc for each attempt.
        // We probably want to count how many unique (support_contrast, blank_index) have a 'first' or 'really_first' or just count unique pairs.

        const uniqueAttempts = await SupportContrastAttemptModel.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: { q: '$support_contrast', b: '$blank_index' },
                    wasCorrect: { $max: { $cond: [{ $eq: ['$correct', true] }, 1, 0] } },
                },
            },
            {
                $group: {
                    _id: null,
                    score: { $sum: '$wasCorrect' },
                    attempted: { $sum: 1 },
                },
            },
        ]);

        const userScore = uniqueAttempts[0]?.score || 0;
        const userAttempted = uniqueAttempts[0]?.attempted || 0;

        // Total available blanks across all questions
        const totalAvailableBlanks = await SupportContrastModel.aggregate([
            { $project: { numBlanks: { $size: '$blanks' } } },
            { $group: { _id: null, total: { $sum: '$numBlanks' } } },
        ]);
        const totalBlanks = totalAvailableBlanks[0]?.total || 0;

        return {
            data,
            meta: {
                limit: limitNum,
                page: pageNum,
                total,
                totalPage: Math.ceil(total / limitNum),
                userScore,
                userAttempted,
                totalBlanks,
            },
        };
    }

    public async getSupportContrastById(userId: string, id: string): Promise<any> {
        const match: any = mongoose.isValidObjectId(id)
            ? { _id: new mongoose.Types.ObjectId(id) }
            : { slug: id };

        const pipeline: PipelineStage[] = [
            { $match: match },
            {
                $lookup: {
                    from: 'supportcontrastattempts',
                    let: { supportContrastId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$support_contrast', '$$supportContrastId'] },
                                        { $eq: ['$user', new mongoose.Types.ObjectId(userId)] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'my_attempts',
                },
            },
        ];

        const result = await SupportContrastModel.aggregate(pipeline);
        return result[0] || null;
    }

    public async submitAttempt(
        userId: string,
        supportContrastId: string,
        attemptData: {
            blank_index: number;
            reasoning_type: 'support' | 'contrast';
            associated_token: string;
            correct: boolean;
        }
    ): Promise<ISupportContrastAttempt> {
        // Count existing attempts for this specific blank to set 'first'
        const existingCount = await SupportContrastAttemptModel.countDocuments({
            user: userId,
            support_contrast: supportContrastId,
            blank_index: attemptData.blank_index,
        });
        const isFirst = existingCount === 0;

        const attempt = await SupportContrastAttemptModel.create({
            user: userId,
            support_contrast: supportContrastId,
            ...attemptData,
            first: isFirst,
            really_first: isFirst,
        });

        return attempt;
    }

    public async resetProgress(userId: string): Promise<void> {
        await SupportContrastAttemptModel.deleteMany({ user: userId });
    }

    public async resetAttempt(
        userId: string,
        supportContrastId: string,
        blank_index: number
    ): Promise<void> {
        await SupportContrastAttemptModel.deleteMany({
            user: userId,
            support_contrast: supportContrastId,
            blank_index,
        });
    }
}

export const supportContrastService = new SupportContrastService();
