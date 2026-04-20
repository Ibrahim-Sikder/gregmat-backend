import { PairingModel } from '@practice/models/pairing.schema';
import { PairingAttemptModel } from '@practice/models/pairingAttempt.schema';
import type { IPairing, IPairingAttempt } from '@practice/interfaces/pairing.interface';
import mongoose, { type PipelineStage } from 'mongoose';
import slugify from 'slugify';

class PairingService {
    public async createPairing(data: any): Promise<IPairing> {
        if (!data.slug && data.title) {
            data.slug = slugify(data.title, { lower: true, strict: true });
        }
        return PairingModel.create(data);
    }

    public async getPairings(
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
                    from: 'pairingattempts',
                    let: { pairingId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$pairing', '$$pairingId'] },
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

        const result = await PairingModel.aggregate(pipeline);
        const data = result[0].data || [];
        const total = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;

        // Get user stats
        const uniqueAttempts = await PairingAttemptModel.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$pairing',
                    // wasCorrect: { $max: { $cond: [{ $eq: ['$correct', true] }, 1, 0] } },
                    // score in pairing seems to be saved directly in the attempt?
                    // actually pairing has a 'score' field in the attempt.
                    // we probably want to count how many pairings have at least one correct (all correct) attempt.
                    // Or sum the scores?
                    // Let's assume we want to count how many pairings have at least one perfect score.
                    // Or just count how many pairings have been attempted and what's the total score.
                    maxScore: { $max: '$score' },
                },
            },
            {
                $group: {
                    _id: null,
                    totalScore: { $sum: '$maxScore' },
                    attempted: { $sum: 1 },
                },
            },
        ]);

        const userScore = uniqueAttempts[0]?.totalScore || 0;
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

    public async getPairingById(userId: string, id: string): Promise<any> {
        // Try to search by _id first, if fails or depending on format, could be legacy id.
        // But assuming Mongoose ObjectId for params.

        const match: any = mongoose.isValidObjectId(id)
            ? { _id: new mongoose.Types.ObjectId(id) }
            : { slug: id };

        const pipeline: PipelineStage[] = [
            { $match: match },
            {
                $lookup: {
                    from: 'pairingattempts',
                    let: { pairingId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$pairing', '$$pairingId'] },
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

        const result = await PairingModel.aggregate(pipeline);
        return result[0] || null;
    }

    public async submitAttempt(
        userId: string,
        pairingId: string,
        attemptData: any
    ): Promise<IPairingAttempt> {
        // attemptData should contain: score, correct, attempt (list of pairs)

        // count existing attempts to set 'first'
        const existingCount = await PairingAttemptModel.countDocuments({
            user: userId,
            pairing: pairingId,
        });
        const isFirst = existingCount === 0;

        const attempt = await PairingAttemptModel.create({
            user: userId,
            pairing: pairingId,
            ...attemptData,
            first: isFirst,
            really_first: isFirst, // assuming logic is same
        });

        return attempt;
    }

    public async resetProgress(userId: string): Promise<void> {
        await PairingAttemptModel.deleteMany({ user: userId });
    }
}

export const pairingService = new PairingService();
