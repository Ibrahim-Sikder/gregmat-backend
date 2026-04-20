import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import { QuestionSchema } from '@quiz/schemas/question';
import questionService from '@service/db/question.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class QuestionController {
    @CatchAsync()
    @ZodValidation(QuestionSchema)
    public async create(req: Request, res: Response): Promise<void> {
        const result = await questionService.createQuestion(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Question created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAll(req: Request, res: Response): Promise<void> {
        const result = await questionService.getAllQuestions(req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'All questions fetched successfully',
            data: result?.data,
            meta: result?.meta,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { questionId } = req.params;
        const result = await questionService.getQuestionById(questionId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Question fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(QuestionSchema.partial())
    public async update(req: Request, res: Response): Promise<void> {
        const { questionId } = req.params;
        const result = await questionService.updateQuestion(questionId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Question updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { questionId } = req.params;
        const result = await questionService.deleteQuestion(questionId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Question deleted successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getByQuizId(req: Request, res: Response): Promise<void> {
        const { quizId } = req.params;
        const result = await questionService.questionsByQuizId(quizId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Questions for the quiz fetched successfully',
            data: result,
        });
    }
}

export default QuestionController;
