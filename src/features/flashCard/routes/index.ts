import { Router } from 'express';
import flashCardClassRoutes from './class.routes';
import flashCardClassGroupRoutes from './classGroup.routes';
import flashCardCourseRoutes from './course.routes';
import flashCardCourseGroupRoutes from './courseGroup.routes';

class FlashCardRoutes {
    public router: Router;

    constructor() {
        this.router = Router();
        this.routes();
    }

    public routes(): Router {
        // FlashCard Class routes
        this.router.use('/classes', flashCardClassRoutes.router);

        // FlashCard Class Group routes
        this.router.use('/class-groups', flashCardClassGroupRoutes.router);

        // FlashCard Course routes
        this.router.use('/courses', flashCardCourseRoutes.router);

        // FlashCard Course Group routes
        this.router.use('/course-groups', flashCardCourseGroupRoutes.router);

        return this.router;
    }
}

const flashCardRoutes = new FlashCardRoutes();
export default flashCardRoutes;
