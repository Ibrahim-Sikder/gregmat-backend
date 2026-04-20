import { ProblemModel } from '@practice/models/problem.schema';
import { ProblemAttemptModel } from '@practice/models/problemAttempt.schema';
import { UserProblemActionModel } from '@practice/models/userProblemAction.schema';
import type { IProblem } from '@practice/interfaces/problem.interface';
import mongoose, { type PipelineStage } from 'mongoose';
import slugify from 'slugify';
import { Query, Search, Pagination, Sort } from '@global/decorators/query.decorators';
import type { IPaginatedResult } from '@global/decorators/query.decorators';

class ProblemService {
    private model = ProblemModel;

    @Query()
    @Search(['title', 'slug', 'body', 'tag'])
    @Pagination(50, 100)
    @Sort('-createdAt')
    public async getProblemsSimple(query: any): Promise<IPaginatedResult<IProblem>> {
        // This method is now handled by decorators
        return {} as any;
    }

    public async getProblems(
        userId: string,
        query: {
            page?: number;
            limit?: number;
            superCategory?: string;
            difficulty?: string;
            status?: string;
            type?: string;
            search?: string;
            tag?: string;
            category?: string;
            hasSolution?: boolean;
            hideDifficulty?: boolean;
            bookmarked?: boolean;
        }
    ): Promise<{
        data: any[];
        meta: {
            limit: number;
            page: number;
            total: number;
            totalPage: number;
        };
    }> {
        const {
            page = 1,
            limit = 50,
            superCategory = 'Quant',
            difficulty,
            status,
            type,
            search,
            tag,
            category,
            hasSolution,
            bookmarked,
        } = query;
        const skip = (page - 1) * limit;

        const matchStage: any = {
            super_category: superCategory === 'all' ? { $ne: null } : superCategory,
        };

        // Handle difficulty filter (can be comma-separated)
        if (difficulty && difficulty.trim()) {
            const difficulties = difficulty
                .split(',')
                .map((d) => d.trim())
                .filter(Boolean);
            if (difficulties.length === 1) {
                matchStage.difficulty = difficulties[0];
            } else if (difficulties.length > 1) {
                matchStage.difficulty = { $in: difficulties };
            }
        }

        // Handle type filter (can be comma-separated)
        if (type && type.trim()) {
            const types = type
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
            if (types.length === 1) {
                matchStage.type = types[0];
            } else if (types.length > 1) {
                matchStage.type = { $in: types };
            }
        }

        // Handle tag filter (can be comma-separated)
        if (tag && tag.trim()) {
            const tags = tag
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
            if (tags.length === 1) {
                matchStage.tag = { $regex: tags[0], $options: 'i' };
            } else if (tags.length > 1) {
                matchStage.tag = { $in: tags.map((t) => new RegExp(t, 'i')) };
            }
        }

        // Handle category filter (maps to first_tlc field, can be comma-separated)
        if (category && category.trim()) {
            const categories = category
                .split(',')
                .map((c) => c.trim())
                .filter(Boolean);
            if (categories.length === 1) {
                matchStage.first_tlc = categories[0];
            } else if (categories.length > 1) {
                matchStage.first_tlc = { $in: categories };
            }
        }

        if (hasSolution) {
            matchStage.has_solution_video = true;
        }

        // Search implementation with $or for multiple fields
        if (search && search.trim()) {
            const searchRegex = { $regex: search.trim(), $options: 'i' };
            matchStage.$or = [
                { title: searchRegex },
                { slug: searchRegex },
                { body: searchRegex },
                { tag: searchRegex },
            ];
        }

        const pipeline: PipelineStage[] = [
            { $match: matchStage },
            {
                $lookup: {
                    from: 'problemattempts',
                    let: { problemId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$problemId', '$$problemId'] },
                                        { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'userAttempts',
                },
            },
            {
                $lookup: {
                    from: 'userproblemactions',
                    let: { problemId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$problemId', '$$problemId'] },
                                        { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'userActions',
                },
            },
            {
                $lookup: {
                    from: 'problemattempts',
                    localField: '_id',
                    foreignField: 'problemId',
                    as: 'allAttempts',
                },
            },
            {
                $addFields: {
                    status: {
                        $switch: {
                            branches: [
                                {
                                    case: {
                                        $gt: [
                                            {
                                                $size: {
                                                    $filter: {
                                                        input: '$userAttempts',
                                                        as: 'attempt',
                                                        cond: {
                                                            $eq: ['$$attempt.isCorrect', true],
                                                        },
                                                    },
                                                },
                                            },
                                            0,
                                        ],
                                    },
                                    then: 'Solved',
                                },
                                {
                                    case: { $gt: [{ $size: '$userAttempts' }, 0] },
                                    then: 'Attempted',
                                },
                            ],
                            default: 'ToDo',
                        },
                    },
                    liked: {
                        $cond: {
                            if: { $gt: [{ $size: '$userActions' }, 0] },
                            then: { $arrayElemAt: ['$userActions.liked', 0] },
                            else: false,
                        },
                    },
                    disliked: {
                        $cond: {
                            if: { $gt: [{ $size: '$userActions' }, 0] },
                            then: { $arrayElemAt: ['$userActions.disliked', 0] },
                            else: false,
                        },
                    },
                    bookmarked: {
                        $cond: {
                            if: { $gt: [{ $size: '$userActions' }, 0] },
                            then: { $arrayElemAt: ['$userActions.bookmarked', 0] },
                            else: false,
                        },
                    },
                    dynamicDifficulty: {
                        $let: {
                            vars: {
                                totalAttempts: { $size: '$allAttempts' },
                                correctAttempts: {
                                    $size: {
                                        $filter: {
                                            input: '$allAttempts',
                                            as: 'att',
                                            cond: { $eq: ['$$att.isCorrect', true] },
                                        },
                                    },
                                },
                            },
                            in: {
                                $cond: {
                                    if: { $eq: ['$$totalAttempts', 0] },
                                    then: '$difficulty',
                                    else: {
                                        $switch: {
                                            branches: [
                                                {
                                                    case: {
                                                        $gte: [
                                                            {
                                                                $divide: [
                                                                    '$$correctAttempts',
                                                                    '$$totalAttempts',
                                                                ],
                                                            },
                                                            0.7,
                                                        ],
                                                    },
                                                    then: 'Easy',
                                                },
                                                {
                                                    case: {
                                                        $gte: [
                                                            {
                                                                $divide: [
                                                                    '$$correctAttempts',
                                                                    '$$totalAttempts',
                                                                ],
                                                            },
                                                            0.4,
                                                        ],
                                                    },
                                                    then: 'Medium',
                                                },
                                                {
                                                    case: {
                                                        $gte: [
                                                            {
                                                                $divide: [
                                                                    '$$correctAttempts',
                                                                    '$$totalAttempts',
                                                                ],
                                                            },
                                                            0.2,
                                                        ],
                                                    },
                                                    then: 'Hard',
                                                },
                                            ],
                                            default: 'Extreme',
                                        },
                                    },
                                },
                            },
                        },
                    },
                    successRate: {
                        $let: {
                            vars: {
                                totalAttempts: { $size: '$allAttempts' },
                                correctAttempts: {
                                    $size: {
                                        $filter: {
                                            input: '$allAttempts',
                                            as: 'att',
                                            cond: { $eq: ['$$att.isCorrect', true] },
                                        },
                                    },
                                },
                            },
                            in: {
                                $cond: {
                                    if: { $eq: ['$$totalAttempts', 0] },
                                    then: 0,
                                    else: {
                                        $multiply: [
                                            {
                                                $divide: ['$$correctAttempts', '$$totalAttempts'],
                                            },
                                            100,
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                $addFields: {
                    user_answer_attempts: {
                        $map: {
                            input: '$userAttempts',
                            as: 'attempt',
                            in: {
                                answered_at: '$$attempt.attemptedAt',
                                correct: '$$attempt.isCorrect',
                                first: '$$attempt.first',
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    allAttempts: 0,
                    userAttempts: 0,
                    userActions: 0,
                },
            },
        ];

        if (status && status.trim()) {
            const statuses = status
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean);
            if (statuses.length === 1) {
                pipeline.push({ $match: { status: statuses[0] } });
            } else if (statuses.length > 1) {
                pipeline.push({ $match: { status: { $in: statuses } } });
            }
        }

        if (bookmarked) {
            pipeline.push({ $match: { bookmarked: true } });
        }

        pipeline.push({
            $facet: {
                data: [{ $skip: skip }, { $limit: limit }],
                totalCount: [{ $count: 'count' }],
            },
        });

        const result = await ProblemModel.aggregate(pipeline);

        const problems = result[0].data;
        const total = result[0].totalCount[0] ? result[0].totalCount[0].count : 0;
        const totalPage = Math.ceil(total / limit);

        return {
            data: problems,
            meta: {
                limit,
                page,
                total,
                totalPage,
            },
        };
    }

    public async getProblemById(problemId: string): Promise<IProblem | null> {
        return ProblemModel.findById(problemId);
    }

    public async getProblemByIdWithUserData(
        userId: string,
        problemId: string
    ): Promise<any | null> {
        const pipeline: PipelineStage[] = [
            { $match: { _id: new mongoose.Types.ObjectId(problemId) } },
            {
                $lookup: {
                    from: 'problemattempts',
                    let: { problemId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$problemId', '$$problemId'] },
                                        { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'userAttempts',
                },
            },
            {
                $lookup: {
                    from: 'userproblemactions',
                    let: { problemId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$problemId', '$$problemId'] },
                                        { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] },
                                    ],
                                },
                            },
                        },
                    ],
                    as: 'userActions',
                },
            },
            {
                $lookup: {
                    from: 'problemattempts',
                    localField: '_id',
                    foreignField: 'problemId',
                    as: 'allAttempts',
                },
            },
            {
                $addFields: {
                    status: {
                        $switch: {
                            branches: [
                                {
                                    case: {
                                        $gt: [
                                            {
                                                $size: {
                                                    $filter: {
                                                        input: '$userAttempts',
                                                        as: 'attempt',
                                                        cond: {
                                                            $eq: ['$$attempt.isCorrect', true],
                                                        },
                                                    },
                                                },
                                            },
                                            0,
                                        ],
                                    },
                                    then: 'Solved',
                                },
                                {
                                    case: { $gt: [{ $size: '$userAttempts' }, 0] },
                                    then: 'Attempted',
                                },
                            ],
                            default: 'ToDo',
                        },
                    },
                    liked: {
                        $cond: {
                            if: { $gt: [{ $size: '$userActions' }, 0] },
                            then: { $arrayElemAt: ['$userActions.liked', 0] },
                            else: false,
                        },
                    },
                    disliked: {
                        $cond: {
                            if: { $gt: [{ $size: '$userActions' }, 0] },
                            then: { $arrayElemAt: ['$userActions.disliked', 0] },
                            else: false,
                        },
                    },
                    bookmarked: {
                        $cond: {
                            if: { $gt: [{ $size: '$userActions' }, 0] },
                            then: { $arrayElemAt: ['$userActions.bookmarked', 0] },
                            else: false,
                        },
                    },
                    successRate: {
                        $let: {
                            vars: {
                                totalAttempts: { $size: '$allAttempts' },
                                correctAttempts: {
                                    $size: {
                                        $filter: {
                                            input: '$allAttempts',
                                            as: 'att',
                                            cond: { $eq: ['$$att.isCorrect', true] },
                                        },
                                    },
                                },
                            },
                            in: {
                                $cond: {
                                    if: { $eq: ['$$totalAttempts', 0] },
                                    then: 0,
                                    else: {
                                        $multiply: [
                                            { $divide: ['$$correctAttempts', '$$totalAttempts'] },
                                            100,
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                $addFields: {
                    user_answer_attempts: {
                        $map: {
                            input: '$userAttempts',
                            as: 'attempt',
                            in: {
                                answered_at: '$$attempt.attemptedAt',
                                correct: '$$attempt.isCorrect',
                                first: '$$attempt.first',
                            },
                        },
                    },
                },
            },
            {
                $project: {
                    allAttempts: 0,
                    userAttempts: 0,
                    userActions: 0,
                },
            },
        ];

        const result = await ProblemModel.aggregate(pipeline);
        return result[0] || null;
    }

    public async createProblem(data: any): Promise<IProblem> {
        data.slug = slugify(data.title, { lower: true, strict: true });
        return ProblemModel.create(data);
    }

    public async updateProblem(problemId: string, data: any): Promise<IProblem | null> {
        if (data.title) {
            data.slug = slugify(data.title, { lower: true, strict: true });
        }
        return ProblemModel.findByIdAndUpdate(problemId, data, { new: true });
    }

    public async deleteProblem(problemId: string): Promise<void> {
        await ProblemModel.findByIdAndDelete(problemId);
    }

    public async addAttempt(
        userId: string,
        problemId: string,
        isCorrect: boolean,
        answer: any
    ): Promise<void> {
        // Check if this is the user's first attempt
        const existingAttempts = await ProblemAttemptModel.countDocuments({
            userId,
            problemId,
        });

        const isFirstAttempt = existingAttempts === 0;

        await ProblemAttemptModel.create({
            userId,
            problemId,
            isCorrect,
            answer,
            first: isFirstAttempt,
        });
    }

    public async resetAttempts(userId: string, problemId: string): Promise<void> {
        await ProblemAttemptModel.deleteMany({
            userId,
            problemId,
        });
    }

    public async toggleLike(
        userId: string,
        problemId: string
    ): Promise<{ liked: boolean; likes: number }> {
        const action = await UserProblemActionModel.findOne({ userId, problemId });

        let liked = false;
        let likesChange = 0;

        if (!action) {
            // Create new action with liked = true
            await UserProblemActionModel.create({
                userId,
                problemId,
                liked: true,
                disliked: false,
                bookmarked: false,
            });
            liked = true;
            likesChange = 1;
        } else {
            // Toggle like
            if (action.liked) {
                // Unlike
                action.liked = false;
                likesChange = -1;
            } else {
                // Like (and remove dislike if present)
                action.liked = true;
                if (action.disliked) {
                    action.disliked = false;
                    likesChange = 2; // +1 for like, +1 for removing dislike
                } else {
                    likesChange = 1;
                }
            }
            await action.save();
            liked = action.liked;
        }

        // Update problem likes count
        const problem = await ProblemModel.findByIdAndUpdate(
            problemId,
            { $inc: { likes: likesChange } },
            { new: true }
        );

        return { liked, likes: problem?.likes || 0 };
    }

    public async toggleDislike(
        userId: string,
        problemId: string
    ): Promise<{ disliked: boolean; likes: number }> {
        const action = await UserProblemActionModel.findOne({ userId, problemId });

        let disliked = false;
        let likesChange = 0;

        if (!action) {
            // Create new action with disliked = true
            await UserProblemActionModel.create({
                userId,
                problemId,
                liked: false,
                disliked: true,
                bookmarked: false,
            });
            disliked = true;
            likesChange = -1;
        } else {
            // Toggle dislike
            if (action.disliked) {
                // Remove dislike
                action.disliked = false;
                likesChange = 1;
            } else {
                // Dislike (and remove like if present)
                action.disliked = true;
                if (action.liked) {
                    action.liked = false;
                    likesChange = -2; // -1 for dislike, -1 for removing like
                } else {
                    likesChange = -1;
                }
            }
            await action.save();
            disliked = action.disliked;
        }

        // Update problem likes count
        const problem = await ProblemModel.findByIdAndUpdate(
            problemId,
            { $inc: { likes: likesChange } },
            { new: true }
        );

        return { disliked, likes: problem?.likes || 0 };
    }

    public async toggleBookmark(
        userId: string,
        problemId: string
    ): Promise<{ bookmarked: boolean }> {
        const action = await UserProblemActionModel.findOne({ userId, problemId });

        let bookmarked = false;

        if (!action) {
            // Create new action with bookmarked = true
            await UserProblemActionModel.create({
                userId,
                problemId,
                liked: false,
                disliked: false,
                bookmarked: true,
            });
            bookmarked = true;
        } else {
            // Toggle bookmark
            action.bookmarked = !action.bookmarked;
            await action.save();
            bookmarked = action.bookmarked;
        }

        return { bookmarked };
    }
}

export const problemService: ProblemService = new ProblemService();
