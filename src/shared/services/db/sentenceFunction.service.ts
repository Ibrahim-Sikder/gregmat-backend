import { SentenceFunctionModel } from '@practice/models/sentenceFunction.schema';
import { SentenceFunctionAttemptModel } from '@practice/models/sentenceFunctionAttempt.schema';
import type {
    ISentenceFunction,
    ISentenceFunctionAttempt,
} from '@practice/interfaces/sentenceFunction.interface';
import mongoose, { type PipelineStage } from 'mongoose';
import slugify from 'slugify';

class SentenceFunctionService {
    public async createSentenceFunction(data: any): Promise<ISentenceFunction> {
        if (!data.slug && data.title) {
            data.slug = slugify(data.title, { lower: true, strict: true });
        }
        return SentenceFunctionModel.create(data);
    }

    public async getSentenceFunctions(
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
                { body: { $regex: search, $options: 'i' } },
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
                    from: 'sentencefunctionattempts',
                    let: { sentenceFunctionId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$sentence_function', '$$sentenceFunctionId'] },
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

        const result = await SentenceFunctionModel.aggregate(pipeline);
        const data = result[0].data || [];
        const total = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;

        // Get user stats
        const uniqueAttempts = await SentenceFunctionAttemptModel.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$sentence_function',
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

        return {
            data,
            meta: {
                limit: limitNum,
                page: pageNum,
                total,
                totalPage: Math.ceil(total / limitNum),
                userScore,
                userAttempted,
            },
        };
    }

    public async getSentenceFunctionById(userId: string, id: string): Promise<any> {
        const match: any = mongoose.isValidObjectId(id)
            ? { _id: new mongoose.Types.ObjectId(id) }
            : { slug: id };

        const pipeline: PipelineStage[] = [
            { $match: match },
            {
                $lookup: {
                    from: 'sentencefunctionattempts',
                    let: { sentenceFunctionId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$sentence_function', '$$sentenceFunctionId'] },
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

        const result = await SentenceFunctionModel.aggregate(pipeline);
        return result[0] || null;
    }

    public async submitAttempt(
        userId: string,
        sentenceFunctionId: string,
        attemptData: { selected_sentence_part: number; correct: boolean }
    ): Promise<ISentenceFunctionAttempt> {
        // Count existing attempts to set 'first'
        const existingCount = await SentenceFunctionAttemptModel.countDocuments({
            user: userId,
            sentence_function: sentenceFunctionId,
        });
        const isFirst = existingCount === 0;

        const attempt = await SentenceFunctionAttemptModel.create({
            user: userId,
            sentence_function: sentenceFunctionId,
            ...attemptData,
            first: isFirst,
            really_first: isFirst,
        });

        return attempt;
    }

    public async resetProgress(userId: string): Promise<void> {
        await SentenceFunctionAttemptModel.deleteMany({ user: userId });
    }
}

export const sentenceFunctionService = new SentenceFunctionService();
