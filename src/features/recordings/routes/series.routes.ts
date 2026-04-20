import adminMiddleware from '@global/helpers/admin';
import authMiddleware from '@global/helpers/auth';
import Series from '@recordings/controllers/series';
import { Router } from 'express';

class SeriesRoutes {
    private router: Router;

    constructor() {
        this.router = Router();
    }

    public routes(): Router {
        this.router.get('/series/all', Series.prototype.getAll);
        this.router.get('/series/:seriesId', Series.prototype.getById);
        this.router.post(
            '/series/create',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            Series.prototype.create
        );
        this.router.put(
            '/series/:seriesId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            Series.prototype.update
        );
        this.router.delete(
            '/series/:seriesId',
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            Series.prototype.delete
        );

        return this.router;
    }
}

const seriesRoutes: SeriesRoutes = new SeriesRoutes();

export default seriesRoutes;
