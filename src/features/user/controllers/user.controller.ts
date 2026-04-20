import { CatchAsync } from '@global/decorators/catch-async';
import sendResponse from '@global/helpers/sendResponse';
import subscriptionService from '@service/db/subscription.service';
import userService from '@service/db/user.service';
import userCache from '@service/redis/user.cache';
import type { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

class UserController {
    @CatchAsync()
    public async getProfile(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;

        let user = await userCache.getUserFromCache(currentUser!.userId);
        if (!user) {
            user = await userService.getUserById(currentUser!.userId);
        }

        const subscription = await subscriptionService.getActiveSubscription(currentUser!.userId);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'User profile fetched successfully',
            data: {
                ...((user as any).toJSON ? (user as any).toJSON() : user),
                subscription: subscription
                    ? subscription.toJSON
                        ? subscription.toJSON()
                        : subscription
                    : null,
            },
        });
    }

    @CatchAsync()
    public async updateProfile(req: Request, res: Response): Promise<void> {
        const { currentUser } = req;
        const updateData = req.body;

        delete updateData.password;
        delete updateData.email;
        delete updateData.authId;
        delete updateData.uId;

        await userService.updateUser(currentUser!.userId, updateData);

        const updatedUser = await userService.getUserById(currentUser!.userId);
        if (updatedUser) {
            await userCache.saveUserToCache(currentUser!.userId, currentUser!.uId, updatedUser);
        }

        const subscription = await subscriptionService.getActiveSubscription(currentUser!.userId);

        res.status(HTTP_STATUS.OK).json({
            message: 'Profile updated successfully',
            user: {
                ...(updatedUser?.toJSON ? updatedUser.toJSON() : updatedUser),
                password: undefined,
                subscription: subscription
                    ? subscription.toJSON
                        ? subscription.toJSON()
                        : subscription
                    : null,
            },
        });
    }

    @CatchAsync()
    public async getAllUsers(req: Request, res: Response): Promise<void> {
        const users = await userService.getAllUsers(req.query);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'Users fetched successfully',
            data: users.data,
            meta: users.meta,
        });
    }

    @CatchAsync()
    public async createUser(req: Request, res: Response): Promise<void> {
        const userData = req.body;

        await userService.createUser(userData);

        sendResponse(res, {
            statusCode: HTTP_STATUS.CREATED,
            success: true,
            message: 'User created successfully',
            data: null,
        });
    }

    @CatchAsync()
    public async updateUser(req: Request, res: Response): Promise<void> {
        const { id } = req.params;
        const updateData = req.body;

        delete updateData.password;
        delete updateData.authId;
        delete updateData.uId;

        await userService.updateUser(id, updateData);

        const updatedUser = await userService.getUserById(id);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'User updated successfully',
            data: updatedUser,
        });
    }

    @CatchAsync()
    public async deleteUser(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        await userService.deleteUserById(id);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'User deleted successfully',
            data: null,
        });
    }

    @CatchAsync()
    public async getUserById(req: Request, res: Response): Promise<void> {
        const { id } = req.params;

        const user = await userService.getUserById(id);

        sendResponse(res, {
            statusCode: HTTP_STATUS.OK,
            success: true,
            message: 'User fetched successfully',
            data: user,
        });
    }
}

export default UserController;
