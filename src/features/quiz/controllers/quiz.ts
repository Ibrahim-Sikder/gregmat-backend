import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import { QuizSchema } from '@quiz/schemas/quiz';
import quizService from '@service/db/quiz.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class QuizController {
    @CatchAsync()
    @ZodValidation(QuizSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await quizService.createQuiz(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Quiz created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await quizService.getAllQuizzes(req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'All quizzes fetched successfully',
            data: result?.data,
            meta: result?.meta,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { quizId } = req.params;
        const { currentUser } = req;
        const result = await quizService.getQuizById(quizId, currentUser?.userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Quiz fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(QuizSchema.partial())
    public async update(req: Request, res: Response): Promise<void> {
        const { quizId } = req.params;
        const result = await quizService.updateQuiz(quizId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Quiz updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { quizId } = req.params;
        const result = await quizService.deleteQuiz(quizId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Quiz deleted successfully',
            data: result,
        });
    }
}

export default QuizController;
