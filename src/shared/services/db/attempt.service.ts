import { Pagination, Query, Search } from '@global/decorators/query.decorators';
import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import withTransaction from '@global/helpers/withTransaction';
import type { IAttempt } from '@quiz/interfaces/attempt.interface';
import AttemptModel from '@quiz/models/attempt.schema';
import QuizModel from '@quiz/models/quiz.schema';
import SuperQuizModel from '@quiz/models/super-quiz.schema';
import type { ObjectId } from 'mongodb';

class AttemptService {
    private model = AttemptModel;

    private quizModel = QuizModel;

    private superQuizModel = SuperQuizModel;

    async createAttempt(data: any): Promise<IAttempt> {
        const quiz = data.attempts[0].quiz;

        if (!Helpers.isValidObjectId(String(quiz))) {
            throw new BadRequestError('Invalid quiz ID in attempt data');
        }

        // Remove empty collection at root
        if (data.collection === '') {
            delete data.collection;
        }

        // Remove empty collection inside attempts
        data.attempts = data.attempts.map((attempt: any) => {
            if (attempt.collection === '') {
                delete attempt.collection;
            }
            return attempt;
        });

        return withTransaction(async (session) => {
            const attempt = new this.model(data);
            const savedAttempt = await attempt.save({ session });

            await this.quizModel.findByIdAndUpdate(
                quiz,
                { $push: { attempts: savedAttempt._id } },
                { session }
            );

            const superQuiz = await this.superQuizModel.findOne({
                questions: { $in: data.attempts.map((a: any) => a.question) },
            });
            if (superQuiz) {
                await this.superQuizModel.findByIdAndUpdate(
                    superQuiz._id,
                    { $push: { attempts: savedAttempt._id } },
                    { session }
                );
            }

            return savedAttempt;
        });
    }

    async getAttemptById(id: string): Promise<IAttempt | null> {
        if (!Helpers.isValidObjectId(id)) {
            throw new BadRequestError('Invalid attempt ID');
        }

        const attempt = await this.model
            .findById(id)
            .populate('attempts.user')
            .populate('attempts.question');

        if (!attempt) {
            throw new BadRequestError('Attempt not found');
        }

        return attempt;
    }

    @Query()
    @Search(['given_essay'])
    @Pagination()
    async getAllAttempts(query: Record<string, any>): Promise<any> {
        return await this.model.find(query).populate('attempts.user').populate('attempts.question');
    }

    async getAttemptsByUserId(userId: string | ObjectId): Promise<IAttempt[]> {
        if (!Helpers.isValidObjectId(userId.toString())) {
            throw new BadRequestError('Invalid user ID');
        }

        return await this.model
            .find({ 'attempts.user': userId })
            .populate('attempts.user')
            .populate('attempts.question')
            .sort({ created_at: -1 });
    }

    async getAttemptsByQuestionId(questionId: string | ObjectId): Promise<IAttempt[]> {
        if (!Helpers.isValidObjectId(questionId.toString())) {
            throw new BadRequestError('Invalid question ID');
        }

        return await this.model
            .find({ 'attempts.question': questionId })
            .populate('attempts.user')
            .populate('attempts.question')
            .sort({ created_at: -1 });
    }

    async updateAttempt(id: string, data: Partial<IAttempt>): Promise<IAttempt | null> {
        if (!Helpers.isValidObjectId(id)) {
            throw new BadRequestError('Invalid attempt ID');
        }

        const attempt = await this.model.findById(id);
        if (!attempt) {
            throw new BadRequestError('Attempt not found');
        }

        return await this.model
            .findByIdAndUpdate(id, data, { new: true })
            .populate('attempts.user')
            .populate('attempts.question');
    }

    async deleteAttempt(id: string): Promise<IAttempt | null> {
        if (!Helpers.isValidObjectId(id)) {
            throw new BadRequestError('Invalid attempt ID');
        }

        const attempt = await this.model.findByIdAndDelete(id);
        if (!attempt) {
            throw new BadRequestError('Attempt not found');
        }

        return attempt;
    }

    async getUserAttemptStats(userId: string | ObjectId): Promise<any> {
        if (!Helpers.isValidObjectId(userId.toString())) {
            throw new BadRequestError('Invalid user ID');
        }

        const attempts = await this.model.find({ 'attempts.user': userId });

        let totalAttempts = 0;
        let correctAttempts = 0;
        let totalScore = 0;
        let totalTime = 0;

        attempts.forEach((attempt) => {
            attempt.attempts.forEach((questionAttempt) => {
                if (questionAttempt.user.toString() === userId.toString()) {
                    totalAttempts++;
                    if (questionAttempt.correct) {
                        correctAttempts++;
                    }
                    totalScore += questionAttempt.score;
                    totalTime += questionAttempt.seconds;
                }
            });
        });

        return {
            userId,
            totalAttempts,
            correctAttempts,
            incorrectAttempts: totalAttempts - correctAttempts,
            accuracy: totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0,
            totalScore,
            averageScore: totalAttempts > 0 ? totalScore / totalAttempts : 0,
            totalTimeSpent: totalTime,
            averageTimePerQuestion: totalAttempts > 0 ? totalTime / totalAttempts : 0,
        };
    }
}

const attemptService = new AttemptService();
export default attemptService;
