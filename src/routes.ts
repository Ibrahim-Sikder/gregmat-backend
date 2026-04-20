import authRoutes from '@auth/routes/auth.routes';
import flashCardRoutes from '@flashCard/routes';
import imageRoutes from '@gallery/routes/image.routes';
import videoRoutes from '@gallery/routes/video.routes';
import authMiddleware from '@global/helpers/auth';
import healthRoutes from '@health/healthRoutes';
import mountainRoutes from '@mountain/routes/mountain.routes';
import testRoutes from '@practice/routes/test.routes';
import promptRoutes from '@practice/routes/prompt.routes';
import essayRoutes from '@practice/routes/essay.routes';
import mainIdeaRoutes from '@practice/routes/mainIdea.routes';
import sentenceSimplifyingRoutes from '@practice/routes/sentenceSimplifying.routes';
import problemRoutes from '@practice/routes/problem.routes';
import pairingRoutes from '@practice/routes/pairing.routes';
import sentenceFunctionRoutes from '@practice/routes/sentenceFunction.routes';
import { supportContrastRoutes } from '@practice/routes/supportContrast.routes';
import { vocabCheckRoutes } from './features/vocabCheck/routes/vocabCheck.routes';
import prepswiftRoutes from '@prepswift/routes';
import attemptRoutes from '@quiz/routes/attempt.routes';
import quizCollectionRoutes from '@quiz/routes/collection.routes';
import questionRoutes from '@quiz/routes/question.route';
import quizRoutes from '@quiz/routes/quiz.routes';
import superQuizRoutes from '@quiz/routes/super-quiz.routes';
import classRoutes from '@recordings/routes/class.routes';
import courseRoutes from '@recordings/routes/course.routes';
import groupRoutes from '@recordings/routes/group.routes';
import seriesRoutes from '@recordings/routes/series.routes';
import { serverAdapter } from '@service/queues/base.queue';
import planRoutes from '@studyPlan/routes/plan.routes';
import sectionRoutes from '@studyPlan/routes/section.routes';
import unitRoutes from '@studyPlan/routes/unit.routes';
import userRoutes from '@user/routes/user.routes';
import subscriptionRoutes from '@subscription/routes/subscription.routes';
import { dashboardRoutes } from '@dashboard/routes/dashboard.routes';
import type { Application } from 'express';
import adminMiddleware from '@global/helpers/admin';
import miscRoutes from '@misc/routes/misc.routes';

const BASE_PATH = '/api/v1';

export default (app: Application): void => {
    const routes = (): void => {
        app.use('/queues', serverAdapter.getRouter());
        app.use('', healthRoutes.root());
        app.use('', healthRoutes.health());
        app.use('', healthRoutes.env());
        app.use('', healthRoutes.instance());
        app.use('', healthRoutes.fiboRoutes());

        // Auth Routes
        app.use(BASE_PATH, authRoutes.routes());

        // User Routes
        app.use(`${BASE_PATH}/user`, authMiddleware.verifyUser, userRoutes.routes());

        // Gallery Routes
        app.use(
            `${BASE_PATH}/image`,
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            imageRoutes.routes()
        );
        app.use(
            `${BASE_PATH}/video`,
            authMiddleware.verifyUser,
            adminMiddleware.requireAdmin,
            videoRoutes.routes()
        );

        // Recording Routes
        app.use(`${BASE_PATH}/recordings`, seriesRoutes.routes());
        app.use(`${BASE_PATH}/recordings`, courseRoutes.routes());
        app.use(`${BASE_PATH}/recordings`, groupRoutes.routes());
        app.use(`${BASE_PATH}/recordings`, classRoutes.routes());

        // Study Plan Routes
        app.use(`${BASE_PATH}/study-plan`, unitRoutes.routes());
        app.use(`${BASE_PATH}/study-plan`, planRoutes.routes());
        app.use(`${BASE_PATH}/study-plan`, sectionRoutes.routes());

        // Quiz Routes
        app.use(`${BASE_PATH}/quiz`, quizRoutes.routes());
        app.use(`${BASE_PATH}/quiz-collection`, quizCollectionRoutes.routes());
        app.use(`${BASE_PATH}/question`, questionRoutes.routes());
        app.use(`${BASE_PATH}/attempt`, attemptRoutes.routes());
        app.use(`${BASE_PATH}/super-quiz`, superQuizRoutes.routes());

        // Practice Routes
        app.use(`${BASE_PATH}/practice`, testRoutes.routes());
        app.use(`${BASE_PATH}/practice`, promptRoutes.routes());
        app.use(`${BASE_PATH}/practice`, essayRoutes.routes());
        app.use(`${BASE_PATH}/practice`, mainIdeaRoutes.router);
        app.use(`${BASE_PATH}/practice`, sentenceSimplifyingRoutes.router);
        app.use(`${BASE_PATH}/practice`, problemRoutes.routes());
        app.use(`${BASE_PATH}/practice`, sentenceFunctionRoutes.routes());
        app.use(`${BASE_PATH}/practice`, supportContrastRoutes.routes());
        app.use(`${BASE_PATH}/practice`, pairingRoutes.routes());
        app.use(`${BASE_PATH}/practice`, vocabCheckRoutes.routes());

        // Mountain Routes
        app.use(`${BASE_PATH}/mountain`, mountainRoutes.routes());

        // FlashCard Routes
        app.use(`${BASE_PATH}/flashcards`, flashCardRoutes.routes());

        // Prepswift Routes
        app.use(`${BASE_PATH}/prepswift`, prepswiftRoutes.routes());

        // Subscription Routes
        app.use(`${BASE_PATH}/subscriptions`, subscriptionRoutes.routes());

        app.use(`${BASE_PATH}/misc`, miscRoutes.routes());

        // Dashboard Routes
        app.use(BASE_PATH, dashboardRoutes.routes());
    };
    routes();
};
