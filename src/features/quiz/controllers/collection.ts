import { CatchAsync } from '@global/decorators/catch-async';
import { ZodValidation } from '@global/decorators/zod-validation';
import sendResponse from '@global/helpers/sendResponse';
import { QuizCollectionSchema, QuizGroupSchema } from '@quiz/schemas/collection';
import quizCollectionService from '@service/db/quizCollection.service';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { z } from 'zod';

class CollectionController {
    @CatchAsync()
    @ZodValidation(QuizCollectionSchema)
    public async createCollection(req: Request, res: Response): Promise<void> {
        const result = await quizCollectionService.createCollection(req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Quiz collection created successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async getAllCollections(req: Request, res: Response): Promise<void> {
        const result = await quizCollectionService.getAllCollections(req.query);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'All quiz collections fetched successfully',
            data: result?.data,
            meta: result?.meta,
        });
    }

    @CatchAsync()
    public async getCollectionById(req: Request, res: Response): Promise<void> {
        const { collectionId } = req.params;
        const { currentUser } = req;
        const result = await quizCollectionService.getCollectionById(
            collectionId,
            currentUser?.userId || ''
        );
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Quiz collection fetched successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(QuizCollectionSchema.partial())
    public async updateCollection(req: Request, res: Response): Promise<void> {
        const { collectionId } = req.params;
        const result = await quizCollectionService.updateCollection(collectionId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Quiz collection updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async deleteCollection(req: Request, res: Response): Promise<void> {
        const { collectionId } = req.params;
        const result = await quizCollectionService.deleteCollection(collectionId);
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Quiz collection deleted successfully',
            data: result,
        });
    }

    // ============ Group Operations within Collection ============

    @CatchAsync()
    @ZodValidation(QuizGroupSchema)
    public async addGroupToCollection(req: Request, res: Response): Promise<void> {
        const { collectionId } = req.params;
        const result = await quizCollectionService.addGroupToCollection(collectionId, req.body);
        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'Quiz group added to collection successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(QuizGroupSchema.partial())
    public async updateGroupInCollection(req: Request, res: Response): Promise<void> {
        const { collectionId, groupSlug } = req.params;
        const result = await quizCollectionService.updateGroupInCollection(
            collectionId,
            groupSlug,
            req.body
        );
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Quiz group updated successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async removeGroupFromCollection(req: Request, res: Response): Promise<void> {
        const { collectionId, groupSlug } = req.params;
        const result = await quizCollectionService.removeGroupFromCollection(
            collectionId,
            groupSlug
        );
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Quiz group removed from collection successfully',
            data: result,
        });
    }

    // ============ Quiz Operations within Group ============

    @CatchAsync()
    @ZodValidation(
        z.object({
            quizId: z.string(),
            order_in_group: z.number().int().min(0).optional(),
        })
    )
    public async addQuizToGroup(req: Request, res: Response): Promise<void> {
        const { collectionId, groupSlug } = req.params;
        const { quizId, order_in_group } = req.body;
        const result = await quizCollectionService.addQuizToGroup(
            collectionId,
            groupSlug,
            quizId,
            order_in_group
        );
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Quiz added to group successfully',
            data: result,
        });
    }

    @CatchAsync()
    public async removeQuizFromGroup(req: Request, res: Response): Promise<void> {
        const { collectionId, groupSlug, quizId } = req.params;
        const result = await quizCollectionService.removeQuizFromGroup(
            collectionId,
            groupSlug,
            quizId
        );
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Quiz removed from group successfully',
            data: result,
        });
    }

    @CatchAsync()
    @ZodValidation(
        z.object({
            quizOrders: z.array(
                z.object({
                    quiz: z.string(),
                    order_in_group: z.number().int().min(0),
                })
            ),
        })
    )
    public async reorderQuizzes(req: Request, res: Response): Promise<void> {
        const { collectionId, groupSlug } = req.params;
        const { quizOrders } = req.body;
        const result = await quizCollectionService.reorderQuizzes(
            collectionId,
            groupSlug,
            quizOrders
        );
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Quizzes reordered successfully',
            data: result,
        });
    }

    public async getQuizGroupBySlug(req: Request, res: Response): Promise<void> {
        const { collectionSlug, groupSlug } = req.params;
        const { currentUser } = req;
        const result = await quizCollectionService.getQuizGroupBySlug(
            collectionSlug,
            groupSlug,
            currentUser?.userId || ''
        );
        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Quiz group fetched successfully',
            data: result,
        });
    }
}

export default CollectionController;
