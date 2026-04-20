import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import type {
    ISentenceSimplifyingAttempt,
    ISentenceSimplifyingPractice,
} from '@practice/interfaces/sentenceSimplifying.interface';
import SentenceSimplifyingAttemptModel from '@practice/models/sentenceSimplifyingAttempt.schema';
import SentenceSimplifyingPracticeModel from '@practice/models/sentenceSimplifying.schema';

class SentenceSimplifyingService {
    // ============ Sentence Simplifying Practice CRUD ============

    async createSentenceSimplifyingPractice(data: {
        title: string;
        mode: 'paragraph' | 'random';
        user_generated: boolean;
        count?: number;
        sentences: any[];
    }): Promise<ISentenceSimplifyingPractice> {
        const slug = Helpers.slugify(data.title);

        // Check if slug already exists
        const existing = await SentenceSimplifyingPracticeModel.findOne({ slug });
        if (existing) {
            throw new BadRequestError('A practice with this title already exists');
        }

        // Create the practice document with embedded sentences
        const practice = await SentenceSimplifyingPracticeModel.create({
            title: data.title,
            slug,
            mode: data.mode,
            user_generated: data.user_generated,
            count: data.count || data.sentences.length,
            sentences: data.sentences,
            attempted: false,
        });

        return practice;
    }

    async getAllSentenceSimplifyingPractices(query: {
        page?: number;
        limit?: number;
        userId?: string;
    }): Promise<{
        count: number;
        next: string | null;
        previous: string | null;
        results: any[];
    }> {
        const page = query.page || 1;
        const limit = query.limit || 20;
        const skip = (page - 1) * limit;

        const totalCount = await SentenceSimplifyingPracticeModel.countDocuments();

        const practices = await SentenceSimplifyingPracticeModel.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // If userId is provided, check if user has attempted each practice
        if (query.userId) {
            const practiceIds = practices.map((p) => p._id);
            const attempts = await SentenceSimplifyingAttemptModel.find({
                sentenceSimplifyingPractice: { $in: practiceIds },
                user: query.userId,
            }).lean();

            const attemptMap = new Map(
                attempts.map((a) => [a.sentenceSimplifyingPractice.toString(), true])
            );

            practices.forEach((practice: any) => {
                practice.attempted = attemptMap.has(practice._id.toString());
            });
        }

        const hasNext = skip + limit < totalCount;
        const hasPrevious = page > 1;

        return {
            count: totalCount,
            next: hasNext ? `/api/sentence-simplifying?page=${page + 1}&limit=${limit}` : null,
            previous: hasPrevious
                ? `/api/sentence-simplifying?page=${page - 1}&limit=${limit}`
                : null,
            results: practices,
        };
    }

    async getSentenceSimplifyingPracticeById(
        id: string,
        userId?: string
    ): Promise<ISentenceSimplifyingPractice & { attempts?: ISentenceSimplifyingAttempt[] }> {
        const isValidId = Helpers.isValidObjectId(id);
        const query = isValidId ? { _id: id } : { slug: id };

        const practice = await SentenceSimplifyingPracticeModel.findOne(query).lean();

        if (!practice) {
            throw new BadRequestError('Sentence simplifying practice not found');
        }

        // If userId provided, include user's attempts
        if (userId) {
            const attempts = await SentenceSimplifyingAttemptModel.find({
                sentenceSimplifyingPractice: practice._id,
                user: userId,
            })
                .sort({ createdAt: -1 })
                .lean();

            return { ...practice, attempts } as any;
        }

        return practice as any;
    }

    async updateSentenceSimplifyingPractice(
        id: string,
        data: Partial<ISentenceSimplifyingPractice>
    ): Promise<ISentenceSimplifyingPractice | null> {
        const practice = await SentenceSimplifyingPracticeModel.findById(id);
        if (!practice) {
            throw new BadRequestError('Sentence simplifying practice not found');
        }

        if (data.title) {
            data.slug = Helpers.slugify(data.title);
        }

        return await SentenceSimplifyingPracticeModel.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteSentenceSimplifyingPractice(id: string): Promise<void> {
        const practice = await SentenceSimplifyingPracticeModel.findById(id);
        if (!practice) {
            throw new BadRequestError('Sentence simplifying practice not found');
        }

        // Delete all associated attempts
        await SentenceSimplifyingAttemptModel.deleteMany({ sentenceSimplifyingPractice: id });

        // Delete the practice
        await SentenceSimplifyingPracticeModel.findByIdAndDelete(id);
    }

    // ============ Attempt Handling ============

    async submitAttempt(data: {
        sentenceSimplifyingPractice: string;
        user: string;
        sentence_attempts: Array<{
            sentence: number;
            given_summary: string;
        }>;
    }): Promise<ISentenceSimplifyingAttempt> {
        // Verify practice exists
        const practice = await SentenceSimplifyingPracticeModel.findById(
            data.sentenceSimplifyingPractice
        );
        if (!practice) {
            throw new BadRequestError('Sentence simplifying practice not found');
        }

        if (practice.sentences.length === 0) {
            throw new BadRequestError('No sentences found for this practice');
        }

        // Validate that all sentence IDs exist
        const sentenceIds = practice.sentences.map((s: any) => s.id);
        const attemptSentenceIds = data.sentence_attempts.map((sa) => sa.sentence);

        for (const attemptSentenceId of attemptSentenceIds) {
            if (!sentenceIds.includes(attemptSentenceId)) {
                throw new BadRequestError(`Invalid sentence ID: ${attemptSentenceId}`);
            }
        }

        // Create initial sentence attempts (ungraded)
        const initialAttempts = data.sentence_attempts.map((attempt) => ({
            sentence: attempt.sentence,
            given_summary: attempt.given_summary,
            reported: false,
            gpt_score: null as any,
            gpt_comment: 'Grading in progress...',
        }));

        // Create the attempt document (ungraded)
        const attemptDoc = await SentenceSimplifyingAttemptModel.create({
            sentenceSimplifyingPractice: data.sentenceSimplifyingPractice,
            user: data.user,
            graded: false,
            score: 0,
            sentence_attempts: initialAttempts,
        });

        // Mark practice as attempted
        if (!practice.attempted) {
            practice.attempted = true;
            await practice.save();
        }

        // TODO: Add job to queue for async grading (similar to mainIdea)
        // sentenceSimplifyingQueue.addSentenceSimplifyingJob('gradeSentenceSimplifyingAttempt', {
        //     attemptId: attemptDoc._id.toString(),
        //     sentenceAttempts: data.sentence_attempts,
        // });

        // Return the attempt with grading status
        const populatedAttempt = await SentenceSimplifyingAttemptModel.findById(
            attemptDoc._id
        ).lean();

        if (!populatedAttempt) {
            throw new BadRequestError('Failed to create attempt');
        }

        return populatedAttempt;
    }

    async getUserAttempts(
        userId: string,
        practiceId?: string
    ): Promise<ISentenceSimplifyingAttempt[]> {
        const query: any = { user: userId };
        if (practiceId) {
            query.sentenceSimplifyingPractice = practiceId;
        }

        return await SentenceSimplifyingAttemptModel.find(query)
            .populate('sentenceSimplifyingPractice')
            .sort({ createdAt: -1 })
            .lean();
    }

    async getAttemptById(attemptId: string, userId?: string): Promise<ISentenceSimplifyingAttempt> {
        const query: any = { _id: attemptId };
        if (userId) {
            query.user = userId;
        }

        const attempt = await SentenceSimplifyingAttemptModel.findOne(query)
            .populate('sentenceSimplifyingPractice')
            .lean();

        if (!attempt) {
            throw new BadRequestError('Attempt not found');
        }

        return attempt;
    }

    async reportSentenceAttempt(attemptId: string, sentenceId: number): Promise<void> {
        const attempt = await SentenceSimplifyingAttemptModel.findById(attemptId);
        if (!attempt) {
            throw new BadRequestError('Attempt not found');
        }

        const sentenceAttempt = attempt.sentence_attempts.find(
            (sa: any) => sa.sentence === sentenceId
        );

        if (!sentenceAttempt) {
            throw new BadRequestError('Sentence attempt not found');
        }

        sentenceAttempt.reported = true;
        await attempt.save();
    }
}

const sentenceSimplifyingService = new SentenceSimplifyingService();
export default sentenceSimplifyingService;
