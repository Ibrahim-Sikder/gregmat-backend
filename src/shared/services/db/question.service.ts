import { Pagination, Query, Search, Sort } from '@global/decorators/query.decorators';
import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import withTransaction from '@global/helpers/withTransaction';
import type { IQuestion } from '@quiz/interfaces/question.interface';
import QuestionModel from '@quiz/models/question.schema';
import QuizModel from '@quiz/models/quiz.schema';

class QuestionService {
    private model = QuestionModel;

    async createQuestion(data: IQuestion): Promise<IQuestion> {
        return withTransaction(async (session) => {
            const slug = Helpers.slugify(
                `${data.title}-${Math.random().toString(36).substring(2, 8)}`
            );

            const [question] = await this.model.create([{ ...data, slug, quiz: data.quiz }], {
                session,
            });

            if (data.quiz) {
                await QuizModel.findByIdAndUpdate(
                    data.quiz,
                    { $push: { questions: question._id } },
                    { session }
                );
            }

            return question;
        });
    }

    async getQuestionById(id: string): Promise<IQuestion> {
        const question = await this.model.findById(id);
        if (!question) throw new BadRequestError('Question not found');
        return question;
    }

    @Query()
    @Search(['title', 'slug', 'body', 'short_meta'])
    @Sort('-createdAt')
    @Pagination()
    async getAllQuestions(query: Record<string, any> = {}): Promise<any> {
        return await this.model.find(query);
    }

    async updateQuestion(id: string, data: IQuestion): Promise<IQuestion | null> {
        return withTransaction(async (session) => {
            const slug = Helpers.slugify(
                `${data.title}-${Math.random().toString(36).substring(2, 8)}`
            );

            const question = await this.model.findByIdAndUpdate(
                id,
                { ...data, slug },
                { new: true, session }
            );

            if (!question) throw new BadRequestError('Question not found');

            if (data.quiz) {
                await QuizModel.findByIdAndUpdate(
                    data.quiz,
                    { $addToSet: { questions: question._id } },
                    { session }
                );
            }

            return question;
        });
    }

    async deleteQuestion(id: string): Promise<IQuestion | null> {
        return withTransaction(async (session) => {
            const question = await this.model.findById(id);
            if (!question) throw new BadRequestError('Question not found');

            const deleted = await this.model.findByIdAndDelete(id, { session });

            if (question.quiz) {
                await QuizModel.findByIdAndUpdate(
                    question.quiz,
                    { $pull: { questions: question._id } },
                    { session }
                );
            }

            return deleted;
        });
    }

    async questionsByQuizId(quizId: string): Promise<IQuestion[]> {
        return await this.model.find({ quiz: quizId });
    }
}

const questionService = new QuestionService();
export default questionService;
