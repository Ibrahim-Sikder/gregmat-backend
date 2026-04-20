import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import type {
    IMainIdeaAttempt,
    IMainIdeaPractice,
    IParagraphAttempt,
    IParagraphDocument,
} from '@practice/interfaces/main-idea.interface';
import MainIdeaAttemptModel from '@practice/models/mainIdeaAttempt.schema';
import MainIdeaPracticeModel from '@practice/models/mainIdeaPractice.schema';
import ParagraphModel from '@practice/models/paragraph.schema';
import mainIdeaQueue from '@service/queues/mainIdea.queue';

class MainIdeaService {
    // ============ Main Idea Practice CRUD ============

    async createMainIdeaPractice(data: {
        title: string;
        mode: 'paragraph' | 'Passage';
        user_generated: boolean;
        paragraphs: any[];
    }): Promise<IMainIdeaPractice> {
        const slug = Helpers.slugify(data.title);

        // Check if slug already exists
        const existing = await MainIdeaPracticeModel.findOne({ slug });
        if (existing) {
            throw new BadRequestError('A practice with this title already exists');
        }

        // Create the main practice document
        const practice = await MainIdeaPracticeModel.create({
            title: data.title,
            slug,
            mode: data.mode,
            user_generated: data.user_generated,
            count: data.paragraphs.length,
            paragraphs: [],
            attempted: false,
        });

        // Create paragraph documents
        const paragraphDocs = await Promise.all(
            data.paragraphs.map((para) =>
                ParagraphModel.create({
                    mainIdeaPractice: practice._id,
                    ...para,
                })
            )
        );

        // Update practice with paragraph IDs
        practice.paragraphs = paragraphDocs.map((p) => p._id) as any;
        await practice.save();

        return practice;
    }

    async getAllMainIdeaPractices(query: {
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

        const totalCount = await MainIdeaPracticeModel.countDocuments();

        const practices = await MainIdeaPracticeModel.find()
            .sort({ createdAt: 1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // If userId is provided, check if user has attempted each practice
        if (query.userId) {
            const practiceIds = practices.map((p) => p._id);
            const attempts = await MainIdeaAttemptModel.find({
                mainIdeaPractice: { $in: practiceIds },
                user: query.userId,
            }).lean();

            const attemptMap = new Map(attempts.map((a) => [a.mainIdeaPractice.toString(), true]));

            practices.forEach((practice: any) => {
                practice.attempted = attemptMap.has(practice._id.toString());
            });
        }

        const hasNext = skip + limit < totalCount;
        const hasPrevious = page > 1;

        return {
            count: totalCount,
            next: hasNext ? `/api/main-idea?page=${page + 1}&limit=${limit}` : null,
            previous: hasPrevious ? `/api/main-idea?page=${page - 1}&limit=${limit}` : null,
            results: practices,
        };
    }

    async getMainIdeaPracticeById(
        id: string,
        userId?: string
    ): Promise<IMainIdeaPractice & { attempts?: IMainIdeaAttempt[] }> {
        const isValidId = Helpers.isValidObjectId(id);
        const query = isValidId ? { _id: id } : { slug: id };

        const practice = await MainIdeaPracticeModel.findOne(query).populate('paragraphs').lean();

        if (!practice) {
            throw new BadRequestError('Main idea practice not found');
        }

        // If userId provided, include user's attempts
        if (userId) {
            const attempts = await MainIdeaAttemptModel.find({
                mainIdeaPractice: practice._id,
                user: userId,
            })
                .populate({
                    path: 'paragraph_attempts.paragraph',
                    model: 'Paragraph',
                })
                .sort({ createdAt: -1 })
                .lean();

            return { ...practice, attempts } as any;
        }

        return practice as any;
    }

    async updateMainIdeaPractice(
        id: string,
        data: Partial<IMainIdeaPractice>
    ): Promise<IMainIdeaPractice | null> {
        const practice = await MainIdeaPracticeModel.findById(id);
        if (!practice) {
            throw new BadRequestError('Main idea practice not found');
        }

        if (data.title) {
            data.slug = Helpers.slugify(data.title);
        }

        return await MainIdeaPracticeModel.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteMainIdeaPractice(id: string): Promise<void> {
        const practice = await MainIdeaPracticeModel.findById(id);
        if (!practice) {
            throw new BadRequestError('Main idea practice not found');
        }

        // Delete all associated paragraphs
        await ParagraphModel.deleteMany({ mainIdeaPractice: id });

        // Delete all associated attempts
        await MainIdeaAttemptModel.deleteMany({ mainIdeaPractice: id });

        // Delete the practice
        await MainIdeaPracticeModel.findByIdAndDelete(id);
    }

    // ============ Attempt Handling ============

    async submitAttempt(data: {
        mainIdeaPractice: string;
        user: string;
        paragraph_attempts: Array<{
            paragraph: string;
            given_main_idea: string;
        }>;
    }): Promise<IMainIdeaAttempt> {
        // Verify practice exists
        const practice = await MainIdeaPracticeModel.findById(data.mainIdeaPractice);
        if (!practice) {
            throw new BadRequestError('Main idea practice not found');
        }

        // Get all paragraphs for this practice
        const paragraphs = await ParagraphModel.find({
            mainIdeaPractice: data.mainIdeaPractice,
        });

        if (paragraphs.length === 0) {
            throw new BadRequestError('No paragraphs found for this practice');
        }

        // Validate that all paragraph IDs exist
        const paragraphIds = paragraphs.map((p) => p._id.toString());
        const attemptParagraphIds = data.paragraph_attempts.map((pa) => pa.paragraph);

        for (const attemptParaId of attemptParagraphIds) {
            if (!paragraphIds.includes(attemptParaId)) {
                throw new BadRequestError(`Invalid paragraph ID: ${attemptParaId}`);
            }
        }

        // Create initial paragraph attempts (ungraded)
        const initialAttempts: IParagraphAttempt[] = data.paragraph_attempts.map((attempt) => ({
            paragraph: attempt.paragraph,
            given_main_idea: attempt.given_main_idea,
            reported: false,
            gpt_score: null as any,
            gpt_comment: 'Grading in progress...',
        }));

        // Create the attempt document (ungraded)
        const attemptDoc = await MainIdeaAttemptModel.create({
            mainIdeaPractice: data.mainIdeaPractice,
            user: data.user,
            graded: false,
            score: 0,
            paragraph_attempts: initialAttempts,
        });

        // Mark practice as attempted
        if (!practice.attempted) {
            practice.attempted = true;
            await practice.save();
        }

        // Add job to queue for async grading
        mainIdeaQueue.addMainIdeaJob('gradeMainIdeaAttempt', {
            attemptId: attemptDoc._id.toString(),
            paragraphAttempts: data.paragraph_attempts,
        });

        // Return the attempt with grading status
        const populatedAttempt = await MainIdeaAttemptModel.findById(attemptDoc._id)
            .populate({
                path: 'paragraph_attempts.paragraph',
                model: 'Paragraph',
            })
            .lean();

        if (!populatedAttempt) {
            throw new BadRequestError('Failed to create attempt');
        }

        return populatedAttempt;
    }

    async getUserAttempts(userId: string, practiceId?: string): Promise<IMainIdeaAttempt[]> {
        const query: any = { user: userId };
        if (practiceId) {
            query.mainIdeaPractice = practiceId;
        }

        return await MainIdeaAttemptModel.find(query)
            .populate('mainIdeaPractice')
            .populate({
                path: 'paragraph_attempts.paragraph',
                model: 'Paragraph',
            })
            .sort({ createdAt: -1 })
            .lean();
    }

    async getAttemptById(attemptId: string, userId?: string): Promise<IMainIdeaAttempt> {
        const query: any = { _id: attemptId };
        if (userId) {
            query.user = userId;
        }

        const attempt = await MainIdeaAttemptModel.findOne(query)
            .populate('mainIdeaPractice')
            .populate({
                path: 'paragraph_attempts.paragraph',
                model: 'Paragraph',
            })
            .lean();

        if (!attempt) {
            throw new BadRequestError('Attempt not found');
        }

        return attempt;
    }

    async reportParagraphAttempt(attemptId: string, paragraphId: string): Promise<void> {
        const attempt = await MainIdeaAttemptModel.findById(attemptId);
        if (!attempt) {
            throw new BadRequestError('Attempt not found');
        }

        const paragraphAttempt = attempt.paragraph_attempts.find(
            (pa) => pa.paragraph.toString() === paragraphId
        );

        if (!paragraphAttempt) {
            throw new BadRequestError('Paragraph attempt not found');
        }

        paragraphAttempt.reported = true;
        await attempt.save();
    }
}

const mainIdeaService = new MainIdeaService();
export default mainIdeaService;
