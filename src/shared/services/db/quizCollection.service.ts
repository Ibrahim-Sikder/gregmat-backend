import { Pagination, Query, Search, SelectFields, Sort } from '@global/decorators/query.decorators';
import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import type { IQuizCollection, IQuizGroup } from '@quiz/interfaces/collection.interface';
import AttemptModel from '@quiz/models/attempt.schema';
import QuizCollectionModel from '@quiz/models/collection.schema';
import { Types } from 'mongoose';

class QuizCollectionService {
    private model = QuizCollectionModel;

    private attemptModel = AttemptModel;

    async createCollection(data: Partial<IQuizCollection>): Promise<IQuizCollection> {
        const slug = Helpers.slugify(data.title!);

        // Check if slug already exists
        const existingCollection = await this.model.findOne({ slug });
        if (existingCollection) {
            throw new BadRequestError('A collection with this title already exists');
        }

        const collection = new this.model({ ...data, slug });
        return await collection.save();
    }

    async getCollectionById(id: string, userId?: string): Promise<any> {
        if (!userId) throw new BadRequestError('User ID is required to fetch collection details');

        const isValidId = Helpers.isValidObjectId(id);
        const query = isValidId ? { _id: id } : { slug: id };

        const userObjectId = new Types.ObjectId(userId);

        // Populate quizzes with ALL attempts (not filtered by user)
        const collection = await this.model.findOne(query).populate({
            path: 'quiz_groups.quizzes.quiz',
            select: 'title slug img body minutes super_category website timing_mode plus_only max_score maxScore questions associated_class associated_content number_of_bookmarks number_of_likes is_prepswift solution',
            populate: {
                path: 'attempts',
                model: 'Attempt',
                // NO MATCH FILTER - get all attempts for global statistics
                select: 'score attempts createdAt created_at updatedAt',
                options: { sort: { createdAt: 1 } },
            },
        });

        if (!collection) throw new BadRequestError('Quiz collection not found');

        // Helper: compute total score for a single Attempt doc
        function computeAttemptScore(attemptDoc: any): number {
            if (!attemptDoc) return 0;

            if (Array.isArray(attemptDoc.attempts) && attemptDoc.attempts.length) {
                return attemptDoc.attempts.reduce((acc: number, q: any) => {
                    const s = Number(q.score ?? q.points ?? 0);
                    return acc + (Number.isFinite(s) ? s : 0);
                }, 0);
            }

            if (typeof attemptDoc.score === 'number' && Number.isFinite(attemptDoc.score))
                return attemptDoc.score;

            return 0;
        }

        // Helper: resolve max score robustly
        function resolveMaxScore(quiz: any, attemptsArr: any[]): number {
            const cand1 = Number(quiz.max_score ?? quiz.maxScore);
            if (Number.isFinite(cand1) && cand1 > 0) return cand1;

            if (Array.isArray(quiz.questions) && quiz.questions.length > 0)
                return quiz.questions.length;

            const firstAttemptWithQuestions = attemptsArr.find(
                (a: any) => Array.isArray(a.attempts) && a.attempts.length > 0
            );
            if (firstAttemptWithQuestions) return firstAttemptWithQuestions.attempts.length;

            return 0;
        }

        const out = collection.toObject
            ? collection.toObject()
            : JSON.parse(JSON.stringify(collection));

        if (Array.isArray(out.quiz_groups)) {
            out.quiz_groups = out.quiz_groups.map((group: any) => {
                const newGroup: any = { ...group };

                if (Array.isArray(group.quizzes)) {
                    newGroup.quizzes = group.quizzes.map((gq: any, idx: number) => {
                        const quiz = gq.quiz ?? gq;
                        const allAttempts = Array.isArray(quiz.attempts) ? quiz.attempts : [];

                        // Separate: current user's attempts vs all attempts
                        const currentUserAttempts = allAttempts.filter((att: any) => {
                            // Check if this attempt belongs to current user
                            if (!Array.isArray(att.attempts)) return false;
                            return att.attempts.some(
                                (q: any) => q.user && q.user.toString() === userObjectId.toString()
                            );
                        });

                        // Compute scores for current user's attempts
                        const currentUserCompactAttempts = currentUserAttempts.map((att: any) => {
                            const score = computeAttemptScore(att);
                            return {
                                score,
                                created_at: att.createdAt ?? att.created_at ?? null,
                            };
                        });

                        // Compute scores for ALL attempts (global statistics)
                        const allCompactAttempts = allAttempts.map((att: any) => {
                            const score = computeAttemptScore(att);
                            return {
                                score,
                                created_at: att.createdAt ?? att.created_at ?? null,
                            };
                        });

                        const maxScore = resolveMaxScore(quiz, allAttempts);

                        // Build attempts array (for current user only)
                        const attemptsWithNormalized = currentUserCompactAttempts.map(
                            (a: any, i: number) => {
                                return {
                                    first: i === 0,
                                    score: a.score,
                                    created_at: a.created_at,
                                    normalized_score: maxScore > 0 ? a.score / maxScore : 0,
                                };
                            }
                        );

                        // Calculate GLOBAL statistics (from ALL attempts)
                        let mean_score = 0;
                        let highest_score = 0;
                        let lowest_score = 0;
                        let normalized_mean_score = 0;

                        if (allCompactAttempts.length > 0) {
                            const allScores = allCompactAttempts.map((a: any) => a.score);

                            mean_score =
                                allScores.reduce((s: number, score: number) => s + score, 0) /
                                allScores.length;
                            highest_score = Math.max(...allScores);
                            lowest_score = Math.min(...allScores);
                            normalized_mean_score = maxScore > 0 ? mean_score / maxScore : 0;
                        }

                        return {
                            quiz: {
                                _id: quiz._id,
                                title: quiz.title,
                                slug: quiz.slug,
                                img: quiz.img ?? null,
                                minutes: quiz.minutes ?? null,
                                super_category: quiz.super_category ?? null,
                                plus_only: !!quiz.plus_only,
                                timing_mode: quiz.timing_mode ?? null,
                                max_score: maxScore,
                                mean_score, // GLOBAL: Average of ALL attempts
                                normalized_mean_score, // GLOBAL: All attempts mean / max_score
                                highest_score, // GLOBAL: Best score across all users
                                lowest_score, // GLOBAL: Worst score across all users
                                associated_class:
                                    quiz.associated_class ?? quiz.associatedClass ?? null,
                                associated_content: quiz.associated_content ?? null,
                                order_in_group: gq.order_in_group ?? idx,
                                attempts: attemptsWithNormalized, // Current user's attempts only
                                number_of_attempts: attemptsWithNormalized.length, // Current user's attempt count
                                number_of_bookmarks: quiz.number_of_bookmarks ?? 0,
                                number_of_likes: quiz.number_of_likes ?? 0,
                                is_prepswift: quiz.is_prepswift ?? false,
                                solution: quiz?.solution,
                            },
                        };
                    });

                    // Calculate group-level statistics (for CURRENT USER only)
                    const quizzesWithAttempts = newGroup.quizzes.filter(
                        (q: any) => q.quiz.attempts && q.quiz.attempts.length > 0
                    );

                    if (quizzesWithAttempts.length > 0) {
                        const firstAttemptScores = quizzesWithAttempts
                            .map((q: any) => {
                                const firstAttempt = q.quiz.attempts.find((a: any) => a.first);
                                return firstAttempt ? firstAttempt.score : null;
                            })
                            .filter((s: number | null) => s !== null);

                        const first_attempt_average =
                            firstAttemptScores.length > 0
                                ? firstAttemptScores.reduce(
                                      (sum: number, s: number) => sum + s,
                                      0
                                  ) / firstAttemptScores.length
                                : 0;

                        const normalized_first_attempt_average =
                            quizzesWithAttempts.length > 0 &&
                            quizzesWithAttempts[0].quiz.max_score > 0
                                ? first_attempt_average / quizzesWithAttempts[0].quiz.max_score
                                : 0;

                        const latestAttemptScores = quizzesWithAttempts
                            .map((q: any) => {
                                const attempts = q.quiz.attempts;
                                return attempts.length > 0
                                    ? attempts[attempts.length - 1].score
                                    : null;
                            })
                            .filter((s: number | null) => s !== null);

                        const latest_attempt_average =
                            latestAttemptScores.length > 0
                                ? latestAttemptScores.reduce(
                                      (sum: number, s: number) => sum + s,
                                      0
                                  ) / latestAttemptScores.length
                                : 0;

                        const normalized_latest_attempt_average =
                            quizzesWithAttempts.length > 0 &&
                            quizzesWithAttempts[0].quiz.max_score > 0
                                ? latest_attempt_average / quizzesWithAttempts[0].quiz.max_score
                                : 0;

                        newGroup.statistics = {
                            total_quizzes: newGroup.quizzes.length,
                            completed_quizzes: quizzesWithAttempts.length,
                            first_attempt_average,
                            normalized_first_attempt_average,
                            latest_attempt_average,
                            normalized_latest_attempt_average,
                        };
                    }
                }

                return newGroup;
            });
        }

        return out;
    }

    @Query()
    @Search(['title', 'body'])
    @Sort('-createdAt')
    @Pagination()
    @SelectFields([
        'title',
        'slug',
        'tagline',
        'created_at',
        'updated_at',
        'website',
        'quiz_groups',
    ])
    async getAllCollections(query: Record<string, any>): Promise<any> {
        return await this.model.find(query);
    }

    async updateCollection(
        id: string,
        data: Partial<IQuizCollection>
    ): Promise<IQuizCollection | null> {
        const collection = await this.model.findById(id);
        if (!collection) {
            throw new BadRequestError('Quiz collection not found');
        }

        // If title is being updated, regenerate slug
        if (data.title && data.title !== collection.title) {
            const slug = Helpers.slugify(data.title);

            // Check if new slug already exists
            const existingCollection = await this.model.findOne({ slug, _id: { $ne: id } });
            if (existingCollection) {
                throw new BadRequestError('A collection with this title already exists');
            }

            data.slug = slug;
        }

        return await this.model.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    }

    async deleteCollection(id: string): Promise<IQuizCollection | null> {
        const collection = await this.model.findByIdAndDelete(id);
        if (!collection) {
            throw new BadRequestError('Quiz collection not found');
        }
        return collection;
    }

    async addGroupToCollection(
        collectionId: string,
        groupData: IQuizGroup
    ): Promise<IQuizCollection | null> {
        const collection = await this.model.findById(collectionId);
        if (!collection) {
            throw new BadRequestError('Quiz collection not found');
        }

        const slug = Helpers.slugify(groupData.title);

        const groupExists = collection.quiz_groups.some((g) => g.slug === slug);
        if (groupExists) {
            throw new BadRequestError('A group with this title already exists in this collection');
        }

        collection.quiz_groups.push({ ...groupData, slug } as IQuizGroup);
        await collection.save();
        return await this.getCollectionById(collectionId);
    }

    async updateGroupInCollection(
        collectionId: string,
        groupSlug: string,
        groupData: Partial<IQuizGroup>
    ): Promise<IQuizCollection | null> {
        const collection = await this.model.findById(collectionId);
        if (!collection) {
            throw new BadRequestError('Quiz collection not found');
        }

        const groupIndex = collection.quiz_groups.findIndex((g) => g.slug === groupSlug);
        if (groupIndex === -1) {
            throw new BadRequestError('Quiz group not found in this collection');
        }

        // If title is being updated, regenerate slug
        if (groupData.title && groupData.title !== collection.quiz_groups[groupIndex].title) {
            const newSlug = Helpers.slugify(groupData.title);

            // Check if new slug already exists
            const existingGroup = collection.quiz_groups.find(
                (g, idx) => g.slug === newSlug && idx !== groupIndex
            );
            if (existingGroup) {
                throw new BadRequestError(
                    'A group with this title already exists in this collection'
                );
            }

            groupData.slug = newSlug;
        }

        // Update the group
        collection.quiz_groups[groupIndex] = {
            ...collection.quiz_groups[groupIndex],
            ...groupData,
        } as IQuizGroup;

        await collection.save();
        return await this.getCollectionById(collectionId);
    }

    async removeGroupFromCollection(
        collectionId: string,
        groupSlug: string
    ): Promise<IQuizCollection | null> {
        const collection = await this.model.findById(collectionId);
        if (!collection) {
            throw new BadRequestError('Quiz collection not found');
        }

        const initialLength = collection.quiz_groups.length;
        collection.quiz_groups = collection.quiz_groups.filter((g) => g.slug !== groupSlug);

        if (collection.quiz_groups.length === initialLength) {
            throw new BadRequestError('Quiz group not found in this collection');
        }

        await collection.save();
        return await this.getCollectionById(collectionId);
    }

    // ============ Quiz Operations within Group ============

    async addQuizToGroup(
        collectionId: string,
        groupSlug: string,
        quizId: string,
        orderInGroup?: number
    ): Promise<IQuizCollection | null> {
        const collection = await this.model.findById(collectionId);
        if (!collection) {
            throw new BadRequestError('Quiz collection not found');
        }

        const group = collection.quiz_groups.find((g) => g.slug === groupSlug);
        if (!group) {
            throw new BadRequestError('Quiz group not found in this collection');
        }

        // Check if quiz already exists in the group
        const quizExists = group.quizzes.some((q) => q.quiz.toString() === quizId);
        if (quizExists) {
            throw new BadRequestError('Quiz already exists in this group');
        }

        // If no order specified, add to the end
        const order = orderInGroup ?? group.quizzes.length;

        group.quizzes.push({
            quiz: quizId as any,
            order_in_group: order,
        });

        // Sort quizzes by order_in_group
        group.quizzes.sort((a, b) => a.order_in_group - b.order_in_group);

        await collection.save();
        return await this.getCollectionById(collectionId);
    }

    async removeQuizFromGroup(
        collectionId: string,
        groupSlug: string,
        quizId: string
    ): Promise<IQuizCollection | null> {
        const collection = await this.model.findById(collectionId);
        if (!collection) {
            throw new BadRequestError('Quiz collection not found');
        }

        const group = collection.quiz_groups.find((g) => g.slug === groupSlug);
        if (!group) {
            throw new BadRequestError('Quiz group not found in this collection');
        }

        const initialLength = group.quizzes.length;
        group.quizzes = group.quizzes.filter((q) => q.quiz.toString() !== quizId);

        if (group.quizzes.length === initialLength) {
            throw new BadRequestError('Quiz not found in this group');
        }

        // Reorder remaining quizzes
        group.quizzes = group.quizzes.map((q, index) => ({
            ...q,
            order_in_group: index,
        }));

        await collection.save();
        return await this.getCollectionById(collectionId);
    }

    async reorderQuizzes(
        collectionId: string,
        groupSlug: string,
        quizOrders: Array<{ quiz: string; order_in_group: number }>
    ): Promise<IQuizCollection | null> {
        const collection = await this.model.findById(collectionId);
        if (!collection) {
            throw new BadRequestError('Quiz collection not found');
        }

        const group = collection.quiz_groups.find((g) => g.slug === groupSlug);
        if (!group) {
            throw new BadRequestError('Quiz group not found in this collection');
        }

        // Update order for each quiz
        quizOrders.forEach((orderUpdate) => {
            const quizRef = group.quizzes.find((q) => q.quiz.toString() === orderUpdate.quiz);
            if (quizRef) {
                quizRef.order_in_group = orderUpdate.order_in_group;
            }
        });

        // Sort quizzes by order_in_group
        group.quizzes.sort((a, b) => a.order_in_group - b.order_in_group);

        await collection.save();
        return await this.getCollectionById(collectionId);
    }

    private transformCollectionForUser(raw: any, userId: string): any {
        const obj = raw.toObject();

        obj.quiz_groups = obj.quiz_groups.map((group: any) => {
            group.quizzes = group.quizzes.map((q: any) => {
                const quiz = q.quiz;

                // determine max score
                const maxScore =
                    quiz.max_score || (quiz.questions ? quiz.questions.length : 0) || 0;

                // create compact attempts for the specific user
                const attempts = (quiz.attempts || []).map((att: any, i: number) => {
                    const score =
                        typeof att.score === 'number'
                            ? att.score
                            : Array.isArray(att.attempts)
                              ? att.attempts.reduce(
                                    (sum: number, a: any) => sum + (a.score ?? 0),
                                    0
                                )
                              : 0;

                    return {
                        first: i === 0,
                        score,
                        created_at: att.createdAt,
                        normalized_score: maxScore > 0 ? score / maxScore : 0,
                    };
                });

                // user-specific mean
                const mean_score =
                    attempts.length > 0
                        ? attempts.reduce((s: number, a: any) => s + a.score, 0) / attempts.length
                        : 0;

                const normalized_mean_score = maxScore > 0 ? mean_score / maxScore : 0;

                return {
                    title: quiz.title,
                    slug: quiz.slug,
                    img: quiz.img || null,
                    minutes: quiz.minutes,
                    super_category: quiz.super_category,
                    plus_only: quiz.plus_only,
                    timing_mode: quiz.timing_mode,
                    max_score: maxScore,
                    mean_score,
                    normalized_mean_score,
                    associated_class: quiz.associated_class ?? null,
                    associated_content: quiz.associated_content ?? null,
                    order_in_group: q.order_in_group,
                    attempts,
                    number_of_bookmarks: quiz.number_of_bookmarks ?? 0,
                    number_of_likes: quiz.number_of_likes ?? 0,
                    is_prepswift: quiz.is_prepswift ?? false,
                };
            });

            return group;
        });

        return obj;
    }

    async getQuizGroupBySlug(
        collectionSlug: string,
        groupSlug: string,
        userId: string
    ): Promise<any> {
        const collection = await this.model.findOne({ slug: collectionSlug }).populate({
            path: 'quiz_groups.quizzes.quiz',
            select: 'title slug img body minutes super_category timing_mode plus_only max_score maxScore questions associated_class associated_content number_of_bookmarks number_of_likes',
            populate: {
                path: 'attempts',
                model: 'Attempt',
                select: 'score attempts createdAt created_at updatedAt',
                options: { sort: { createdAt: 1 } },
            },
        });

        if (!collection) {
            throw new BadRequestError('Quiz collection not found');
        }

        const group = collection.quiz_groups.find((g) => g.slug === groupSlug);
        if (!group) {
            throw new BadRequestError('Quiz group not found in this collection');
        }

        // Transform the collection data for the specific user
        const transformedCollection = this.transformCollectionForUser(collection, userId);

        // Find and return the specific group
        const transformedGroup = transformedCollection.quiz_groups.find(
            (g: any) => g.slug === groupSlug
        );

        return {
            title: collection.title,
            slug: collection.slug,
            img: collection.img,
            body: collection.body,
            tagline: collection.tagline,
            website: collection.website,
            quiz_groups: [
                {
                    ...transformedGroup,
                    quizzes: transformedGroup.quizzes.map((q: any) => ({ quiz: q })),
                },
            ],
        };
    }
}

const quizCollectionService = new QuizCollectionService();
export default quizCollectionService;
