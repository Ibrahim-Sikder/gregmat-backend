import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import { AddQuestionSchema, SuperQuizSchema } from '@quiz/schemas/super-quiz';
import superQuizService from '@service/db/super-quiz.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class SuperQuizController {
    @CatchAsync()
    @ZodValidation(AddQuestionSchema)
    public async addQuestion(req: Request, res: Response): Promise<void> {
        const { questionId } = req.body;
        const { currentUser } = req;
        const result = await superQuizService.addQuestionToSuperQuiz(
            questionId,
            currentUser!.userId
        );
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Question added to Super Quiz successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async removeQuestion(req: Request, res: Response): Promise<void> {
        const { questionId } = req.params;
        const { currentUser } = req;
        const result = await superQuizService.removeQuestionFromSuperQuiz(
            questionId,
            currentUser!.userId
        );
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Question removed from Super Quiz successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getMySuperQuiz(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;
        const result = await superQuizService.getUserSuperQuiz(currentUser!.userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: result ? 'Super Quiz fetched successfully' : 'No Super Quiz found',
            data: result,
        });
    }

    @CatchAsync()
    public async getById(req: Request, res: Response): Promise<void> {
        const { superQuizId } = req.params;
        const { currentUser } = req;
        const result = await superQuizService.getSuperQuizById(superQuizId, currentUser!.userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Super Quiz fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(SuperQuizSchema.partial())
    public async update(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;
        const result = await superQuizService.updateSuperQuiz(req.body, currentUser!.userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Super Quiz updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async delete(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;
        const result = await superQuizService.deleteSuperQuiz(currentUser!.userId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Super Quiz deleted successfully',
            data: result,
        });
    }
}

export default SuperQuizController;
