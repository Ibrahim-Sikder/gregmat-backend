import prepswiftCourseRoutes from './course.routes';
import prepswiftCategoryRoutes from './category.routes';
import prepswiftContentRoutes from './content.routes';
import userProgressRoutes from './userProgress.routes';
import { Router } from 'express';

class PrepswiftRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        this.router.use('/courses', prepswiftCourseRoutes.router);
        this.router.use('/categories', prepswiftCategoryRoutes.router);
        this.router.use('/contents', prepswiftContentRoutes.router);
        this.router.use('/course/progress', userProgressRoutes.router);

        return this.router;
    }
}

const prepswiftRoutes = new PrepswiftRoutes();
export default prepswiftRoutes;
