import { Pagination, Query, Search, Sort } from '@global/decorators/query.decorators';
import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import withTransaction from '@global/helpers/withTransaction';
import type { IQuiz, ISection } from '@quiz/interfaces/quiz.interface';
import AttemptModel from '@quiz/models/attempt.schema';
import QuizCollectionModel from '@quiz/models/collection.schema';
import QuizModel from '@quiz/models/quiz.schema';
import SuperQuizModel from '@quiz/models/super-quiz.schema';

class QuizService {
    private model = QuizModel;

    private attemptsModel = AttemptModel;

    private collectionModel = QuizCollectionModel;

    async createQuiz(data: IQuiz): Promise<IQuiz> {
        const slug = Helpers.slugify(data.title);
        const quiz = new this.model({ ...data, slug });
        return await quiz.save();
    }

    async getQuizById(id: string, userId?: string): Promise<IQuiz | null> {
        const isValidId = Helpers.isValidObjectId(id);
        const query = isValidId ? { _id: id } : { slug: id };

        // optional: latest session lookup (keep if you need it elsewhere)
        const latestAttemptSession = await this.attemptsModel
            .findOne({ quiz: id, user: userId })
            .sort({ createdAt: -1 })
            .lean();

        const quiz = await this.model
            .findOne(query)
            .populate('questions')
            .populate({
                path: 'attempts', // the field on Quiz that stores Attempt _id refs
                model: this.attemptsModel.modelName, // ensure correct model
            })
            .lean();

        if (!quiz) throw new BadRequestError('Quiz not found');

        const isCorrect = (a: any): boolean => {
            if (a == null) return false;
            if (typeof a.correct === 'boolean') return a.correct;
            if (typeof a.correct === 'number') return a.correct === 1;
            // fallback: treat truthy 'true' string too
            if (typeof a.correct === 'string') return a.correct === 'true' || a.correct === '1';
            return false;
        };

        if (userId && Array.isArray(quiz.attempts)) {
            quiz.attempts = quiz.attempts
                .map((session: any) => {
                    // make sure session.attempts exists and is an array
                    session.attempts = Array.isArray(session.attempts)
                        ? session.attempts.filter((a: any) => String(a.user) === String(userId))
                        : [];
                    return session;
                })
                .filter(
                    (session: any) => Array.isArray(session.attempts) && session.attempts.length > 0
                );
        }

        // For each populated attempt session compute a summary
        if (Array.isArray(quiz.attempts)) {
            quiz.attempts = quiz.attempts.map((session: any) => {
                const attemptsArr = Array.isArray(session.attempts) ? session.attempts : [];

                const totalQuestions = attemptsArr.length;
                const correctCount = attemptsArr.reduce(
                    (acc: number, a: any) => acc + (isCorrect(a) ? 1 : 0),
                    0
                );
                const incorrectCount = totalQuestions - correctCount;

                // Scores may be stored per attempt; guard missing fields
                const totalScore = attemptsArr.reduce(
                    (acc: number, a: any) => acc + (Number(a.score) || 0),
                    0
                );
                const totalScoreDenom = attemptsArr.reduce(
                    (acc: number, a: any) => acc + (Number(a.score_denom) || 0),
                    0
                );

                // total seconds spent on this session's attempts (if you record seconds per question)
                const totalSeconds = attemptsArr.reduce(
                    (acc: number, a: any) => acc + (Number(a.seconds) || 0),
                    0
                );

                const accuracyPct =
                    totalQuestions > 0
                        ? Math.round((correctCount / totalQuestions) * 10000) / 100
                        : 0;
                // accuracyPct rounded to 2 decimals

                // attach a summary to the session
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

        // attach latestAttemptSession if you want it on the returned object
        if (latestAttemptSession) {
            (quiz as any).latestAttemptSession = latestAttemptSession;
        }

        // Check if questions are in user's super quiz
        if (userId) {
            const superQuiz = await SuperQuizModel.findOne({ userId }).lean();
            const superQuizQuestionIds = superQuiz ? superQuiz.questions.map((q) => String(q)) : [];

            if (Array.isArray(quiz.questions)) {
                quiz.questions = quiz.questions.map((question: any) => ({
                    ...question,
                    isInSuperQuiz: superQuizQuestionIds.includes(String(question._id)),
                }));
            }
        }

        // keep your existing section transform behaviour
        if (quiz.sections && quiz.sections.length > 0) {
            return this.groupQuestionsBySections(quiz);
        }

        return quiz;
    }

    @Query()
    @Search(['title', 'slug', 'body'])
    @Pagination()
    @Sort('-createdAt')
    async getAllQuizzes(query: Record<string, any>): Promise<any> {
        return await this.model.find(query);
    }

    async updateQuiz(id: string, data: IQuiz): Promise<IQuiz | null> {
        const quiz = await this.model.findById(id);
        if (!quiz) {
            throw new BadRequestError('Quiz not found');
        }

        const slug = Helpers.slugify(data.title);
        return await this.model
            .findByIdAndUpdate(id, { ...data, slug }, { new: true })
            .populate('questions');
    }

    async deleteQuiz(id: string): Promise<IQuiz | null> {
        return await withTransaction(async (session) => {
            const quiz = await this.model.findByIdAndDelete(id, { session });
            if (!quiz) {
                throw new BadRequestError('Quiz not found');
            }

            // check if the quiz is part of any collection
            const collections = await this.collectionModel
                .find({
                    quiz_groups: { $elemMatch: { quizzes: { $elemMatch: { quiz: quiz._id } } } },
                })
                .session(session);
            if (collections.length > 0) {
                throw new BadRequestError('Cannot delete quiz as it is part of a collection');
            }

            return quiz;
        });
    }

    private groupQuestionsBySections(quiz: IQuiz): any {
        const quizObj = quiz.toObject ? quiz.toObject() : quiz;
        const sectionsWithQuestions = quizObj.sections.map((section: ISection) => ({
            identifier: section.identifier,
            title: section.title,
            section_type: section.section_type,
            minutes: section.minutes,
            description: section.description,
            questions: quizObj.questions.slice(section.start_index - 1, section.end_index),
            question_count: section.end_index - section.start_index + 1,
            start_index: section.start_index,
            end_index: section.end_index,
        }));

        return {
            ...quizObj,
            sections: sectionsWithQuestions,
            total_questions: quizObj.questions.length,
            total_sections: sectionsWithQuestions.length,
        };
    }
}

const quizService = new QuizService();
export default quizService;
