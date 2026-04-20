import { Pagination, Query, Search, Sort } from '@global/decorators/query.decorators';
import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import withTransaction from '@global/helpers/withTransaction';
import type { SuperQuiz } from '@quiz/interfaces/super-quiz.interface';
import AttemptModel from '@quiz/models/attempt.schema';
import QuestionModel from '@quiz/models/question.schema';
import SuperQuizModel from '@quiz/models/super-quiz.schema';

class SuperQuizService {
    private model = SuperQuizModel;

    private questionModel = QuestionModel;

    private attemptsModel = AttemptModel;

    async addQuestionToSuperQuiz(questionId: string, userId: string): Promise<SuperQuiz> {
        // Verify the question exists
        const question = await this.questionModel.findById(questionId);
        if (!question) {
            throw new BadRequestError('Question not found');
        }

        // Find or create the user's super quiz
        let superQuiz = await this.model.findOne({ userId });

        if (!superQuiz) {
            // Create a new super quiz for this user
            superQuiz = new this.model({
                title: 'My Super Quiz',
                description: 'Custom quiz with selected questions',
                questions: [],
                userId,
                attempts: [],
            });
        }

        // Check if question already exists in the super quiz
        if (superQuiz.questions.some((q) => String(q) === String(questionId))) {
            throw new BadRequestError('Question already exists in your Super Quiz');
        }

        // Add the question
        superQuiz.questions.push(questionId as any);
        return await superQuiz.save();
    }

    async removeQuestionFromSuperQuiz(questionId: string, userId: string): Promise<SuperQuiz> {
        // Find the user's super quiz
        const superQuiz = await this.model.findOne({ userId });
        if (!superQuiz) {
            throw new BadRequestError('You do not have a Super Quiz yet');
        }

        // Remove the question
        superQuiz.questions = superQuiz.questions.filter((q) => String(q) !== String(questionId));

        return await superQuiz.save();
    }

    async getSuperQuizById(id: string, userId?: string): Promise<SuperQuiz | null> {
        const isValidId = Helpers.isValidObjectId(id);
        if (!isValidId) {
            throw new BadRequestError('Invalid SuperQuiz ID');
        }

        const superQuiz = await this.model
            .findById(id)
            .populate('questions')
            .populate({
                path: 'attempts',
                model: this.attemptsModel.modelName,
            })
            .lean();

        if (!superQuiz) {
            throw new BadRequestError('SuperQuiz not found');
        }

        // Helper function to check if an attempt is correct
        const isCorrect = (a: any): boolean => {
            if (a == null) return false;
            if (typeof a.correct === 'boolean') return a.correct;
            if (typeof a.correct === 'number') return a.correct === 1;
            if (typeof a.correct === 'string') return a.correct === 'true' || a.correct === '1';
            return false;
        };

        // Filter attempts by user and calculate summaries
        if (userId && Array.isArray(superQuiz.attempts)) {
            superQuiz.attempts = superQuiz.attempts
                .map((session: any) => {
                    // Filter attempts for this user
                    session.attempts = Array.isArray(session.attempts)
                        ? session.attempts.filter((a: any) => String(a.user) === String(userId))
                        : [];
                    return session;
                })
                .filter(
                    (session: any) => Array.isArray(session.attempts) && session.attempts.length > 0
                );

            // Calculate summary for each attempt session
            superQuiz.attempts = superQuiz.attempts.map((session: any) => {
                const attemptsArr = Array.isArray(session.attempts) ? session.attempts : [];

                const totalQuestions = attemptsArr.length;
                const correctCount = attemptsArr.reduce(
                    (acc: number, a: any) => acc + (isCorrect(a) ? 1 : 0),
                    0
                );
                const incorrectCount = totalQuestions - correctCount;

                const totalScore = attemptsArr.reduce(
                    (acc: number, a: any) => acc + (Number(a.score) || 0),
                    0
                );
                const totalScoreDenom = attemptsArr.reduce(
                    (acc: number, a: any) => acc + (Number(a.score_denom) || 0),
                    0
                );

                const totalSeconds = attemptsArr.reduce(
                    (acc: number, a: any) => acc + (Number(a.seconds) || 0),
                    0
                );

                const accuracyPct =
                    totalQuestions > 0
                        ? Math.round((correctCount / totalQuestions) * 10000) / 100
                        : 0;

                // Attach summary to the session
                session.summary = {
                    total_questions: totalQuestions,
                    correct: correctCount,
                    incorrect: incorrectCount,
                    total_score: totalScore,
                    total_score_denom: totalScoreDenom,
                    total_seconds: totalSeconds,
                    accuracy_percent: accuracyPct,
                };

                return session;
            });
        }

        return superQuiz;
    }

    async getUserSuperQuiz(userId: string): Promise<SuperQuiz | null> {
        const superQuiz = await this.model
            .findOne({ userId })
            .populate('questions')
            .populate({
                path: 'attempts',
                model: this.attemptsModel.modelName,
            })
            .lean();

        if (!superQuiz) {
            return null;
        }

        // Helper function to check if an attempt is correct
        const isCorrect = (a: any): boolean => {
            if (a == null) return false;
            if (typeof a.correct === 'boolean') return a.correct;
            if (typeof a.correct === 'number') return a.correct === 1;
            if (typeof a.correct === 'string') return a.correct === 'true' || a.correct === '1';
            return false;
        };

        // Filter attempts by user and calculate summaries
        if (Array.isArray(superQuiz.attempts)) {
            superQuiz.attempts = superQuiz.attempts
                .map((session: any) => {
                    // Filter attempts for this user
                    session.attempts = Array.isArray(session.attempts)
                        ? session.attempts.filter((a: any) => String(a.user) === String(userId))
                        : [];
                    return session;
                })
                .filter(
                    (session: any) => Array.isArray(session.attempts) && session.attempts.length > 0
                );

            // Calculate summary for each attempt session
            superQuiz.attempts = superQuiz.attempts.map((session: any) => {
                const attemptsArr = Array.isArray(session.attempts) ? session.attempts : [];

                const totalQuestions = attemptsArr.length;
                const correctCount = attemptsArr.reduce(
                    (acc: number, a: any) => acc + (isCorrect(a) ? 1 : 0),
                    0
                );
                const incorrectCount = totalQuestions - correctCount;

                const totalScore = attemptsArr.reduce(
                    (acc: number, a: any) => acc + (Number(a.score) || 0),
                    0
                );
                const totalScoreDenom = attemptsArr.reduce(
                    (acc: number, a: any) => acc + (Number(a.score_denom) || 0),
                    0
                );

                const totalSeconds = attemptsArr.reduce(
                    (acc: number, a: any) => acc + (Number(a.seconds) || 0),
                    0
                );

                const accuracyPct =
                    totalQuestions > 0
                        ? Math.round((correctCount / totalQuestions) * 10000) / 100
                        : 0;

                // Attach summary to the session
                session.summary = {
                    total_questions: totalQuestions,
                    correct: correctCount,
                    incorrect: incorrectCount,
                    total_score: totalScore,
                    total_score_denom: totalScoreDenom,
                    total_seconds: totalSeconds,
                    accuracy_percent: accuracyPct,
                };

                return session;
            });
        }

        return superQuiz;
    }

    async updateSuperQuiz(
        data: { title?: string; description?: string },
        userId: string
    ): Promise<SuperQuiz | null> {
        const superQuiz = await this.model.findOne({ userId });
        if (!superQuiz) {
            throw new BadRequestError('You do not have a Super Quiz yet');
        }

        return await this.model
            .findByIdAndUpdate(superQuiz._id, data, { new: true })
            .populate('questions');
    }

    async deleteSuperQuiz(userId: string): Promise<SuperQuiz | null> {
        return await withTransaction(async (session) => {
            const superQuiz = await this.model.findOne({ userId }).session(session);
            if (!superQuiz) {
                throw new BadRequestError('You do not have a Super Quiz yet');
            }

            return await this.model.findByIdAndDelete(superQuiz._id, { session });
        });
    }
}

const superQuizService = new SuperQuizService();
export default superQuizService;
