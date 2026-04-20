import type { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import AuthModel from '@auth/models/auth.schema';
import SubscriptionModel from '@subscription/models/subscription.schema';
import SubscriptionRequestModel from '@subscription/models/subscriptionRequest.schema';
import { ProblemModel } from '@practice/models/problem.schema';
import QuizModel from '@quiz/models/quiz.schema';
import CourseModel from '@recordings/models/course.schema';
import {
    SubscriptionStatus,
    SubscriptionRequestStatus,
} from '@subscription/interfaces/subscription.interface';
import moment from 'moment';

export class DashboardController {
    public async getStats(req: Request, res: Response): Promise<void> {
        const totalUsers = await AuthModel.countDocuments();
        const verifiedUsers = await AuthModel.countDocuments({ isEmailVerified: true });

        // Subscriptions
        const activeSubscriptions = await SubscriptionModel.countDocuments({
            status: SubscriptionStatus.ACTIVE,
        });
        const revenueAggregation = await SubscriptionModel.aggregate([
            { $match: { status: SubscriptionStatus.ACTIVE } },
            { $group: { _id: null, total: { $sum: '$price' } } },
        ]);
        const totalRevenue = revenueAggregation.length > 0 ? revenueAggregation[0].total : 0;

        const totalProblems = await ProblemModel.countDocuments();
        const totalQuizzes = await QuizModel.countDocuments();
        const totalCourses = await CourseModel.countDocuments();

        const oneWeekAgo = moment().subtract(7, 'days').startOf('day').toDate();
        const newUsersLastWeek = await AuthModel.countDocuments({
            createdAt: { $gte: oneWeekAgo },
        });

        // Subscription Requests Summary
        const pendingRequests = await SubscriptionRequestModel.countDocuments({
            status: SubscriptionRequestStatus.PENDING,
        });
        const approvedRequests = await SubscriptionRequestModel.countDocuments({
            status: SubscriptionRequestStatus.APPROVED,
        });
        const rejectedRequests = await SubscriptionRequestModel.countDocuments({
            status: SubscriptionRequestStatus.REJECTED,
        });

        // Revenue Trend (Last 6 Months)
        const sixMonthsAgo = moment().subtract(6, 'months').startOf('month').toDate();
        const revenueTrend = await SubscriptionModel.aggregate([
            { $match: { status: SubscriptionStatus.ACTIVE, createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                    },
                    total: { $sum: '$price' },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } },
        ]);

        // User Growth Trend (Last 7 Days)
        const userGrowthTrend = await AuthModel.aggregate([
            { $match: { createdAt: { $gte: oneWeekAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const formattedRevenueTrend = revenueTrend.map((item) => ({
            month: moment()
                .month(item._id.month - 1)
                .format('MMM'),
            total: item.total,
        }));

        const formattedUserGrowthTrend = userGrowthTrend.map((item) => ({
            date: item._id,
            count: item.count,
        }));

        // Recent Activity
        const recentUsers = await AuthModel.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('username email isEmailVerified createdAt');
        const recentSubscriptionRequests = await SubscriptionRequestModel.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'username email');

        res.status(StatusCodes.OK).json({
            message: 'Dashboard stats',
            stats: {
                users: {
                    total: totalUsers,
                    verified: verifiedUsers,
                    newLastWeek: newUsersLastWeek,
                },
                subscriptions: {
                    active: activeSubscriptions,
                    revenue: totalRevenue,
                },
                content: {
                    problems: totalProblems,
                    quizzes: totalQuizzes,
                    courses: totalCourses,
                },
                subscriptionRequests: {
                    pending: pendingRequests,
                    approved: approvedRequests,
                    rejected: rejectedRequests,
                },
                trends: {
                    revenue: formattedRevenueTrend,
                    userGrowth: formattedUserGrowthTrend,
                },
                recent: {
                    users: recentUsers,
                    subscriptionRequests: recentSubscriptionRequests,
                },
            },
        });
    }
}
