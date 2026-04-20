import authMiddleware from '@global/helpers/auth';
import UserController from '@user/controllers/user.controller';
import { Router } from 'express';

class UserRoutes {
    private router: Router;

    constructor() {
        this.router = Router();
    }

    public routes(): Router {
        this.router.get('/all', UserController.prototype.getAllUsers);
        this.router.get('/profile', UserController.prototype.getProfile);
        this.router.post(
            '/profile',
            authMiddleware.verifyUser,
            UserController.prototype.getProfile
        );
        this.router.put('/profile', UserController.prototype.updateProfile);

        // User management routes
        this.router.post('/', UserController.prototype.createUser);
        this.router.get('/:id', UserController.prototype.getUserById);
        this.router.put('/:id', UserController.prototype.updateUser);
        this.router.delete('/:id', UserController.prototype.deleteUser);

        return this.router;
    }
}

const userRoutes: UserRoutes = new UserRoutes();

export default userRoutes;
