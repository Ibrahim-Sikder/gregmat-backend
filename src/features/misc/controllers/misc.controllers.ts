import type { Request, Response } from 'express';
import { MiscQuizModel } from '../models/misc.models';
import { miscQuizSchema } from '../schemas/misc.schemas';
import sendResponse from '@global/helpers/sendResponse';
import { StatusCodes } from 'http-status-codes';

export const createMiscQuiz = async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedData = miscQuizSchema.parse(req.body);
        const newMiscQuiz = await MiscQuizModel.create(validatedData);
        sendResponse(res, {
            statusCode: StatusCodes.CREATED,
            success: true,
            message: 'Misc quiz created successfully',
            data: newMiscQuiz,
        });
    } catch (error) {
        sendResponse(res, {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Error creating misc quiz',
            data: error as Error,
        });
    }
};

export const getMiscQuizzes = async (req: Request, res: Response): Promise<void> => {
    try {
        const miscQuizzes = await MiscQuizModel.find();
        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Misc quizzes fetched successfully',
            data: miscQuizzes,
        });
    } catch (error) {
        sendResponse(res, {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Error fetching misc quizzes',
            data: error as Error,
        });
    }
};

export const getMiscQuizBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        const miscQuiz = await MiscQuizModel.findOne({ slug });
        if (!miscQuiz) {
            sendResponse(res, {
                statusCode: StatusCodes.NOT_FOUND,
                success: false,
                message: 'Misc quiz not found',
                data: null,
            });
            return;
        }
        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Misc quiz fetched successfully',
            data: miscQuiz,
        });
    } catch (error) {
        sendResponse(res, {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Error fetching misc quiz',
            data: error as Error,
        });
    }
};

export const updateMiscQuiz = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        const validatedData = miscQuizSchema.partial().parse(req.body);
        const updatedMiscQuiz = await MiscQuizModel.findOneAndUpdate({ slug }, validatedData, {
            new: true,
        });
        if (!updatedMiscQuiz) {
            sendResponse(res, {
                statusCode: StatusCodes.NOT_FOUND,
                success: false,
                message: 'Misc quiz not found',
                data: null,
            });
            return;
        }
        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Misc quiz updated successfully',
            data: updatedMiscQuiz,
        });
    } catch (error) {
        sendResponse(res, {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Error updating misc quiz',
            data: error as Error,
        });
    }
};

export const deleteMiscQuiz = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        const deletedMiscQuiz = await MiscQuizModel.findOneAndDelete({ slug });
        if (!deletedMiscQuiz) {
            sendResponse(res, {
                statusCode: StatusCodes.NOT_FOUND,
                success: false,
                message: 'Misc quiz not found',
                data: null,
            });
            return;
        }
        sendResponse(res, {
            statusCode: StatusCodes.OK,
            success: true,
            message: 'Misc quiz deleted successfully',
            data: null,
        });
    } catch (error) {
        sendResponse(res, {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            success: false,
            message: 'Error deleting misc quiz',
            data: error as Error,
        });
    }
};
