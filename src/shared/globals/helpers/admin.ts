import { NotAuthorizedError } from '@global/helpers/error-handlers';
import { UserRole } from '@user/interfaces/user.interface';
import type { NextFunction, Request, Response } from 'express';

class AdminMiddleware {
    public async requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
        if (!req.currentUser) {
            throw new NotAuthorizedError('UNAUTHORIZED');
        }

        if (req.currentUser.role !== UserRole.ADMIN) {
            throw new NotAuthorizedError('THIS ACTION REQUIRES ADMIN PRIVILEGES');
        }

        next();
    }
}

const adminMiddleware = new AdminMiddleware();
export default adminMiddleware;
