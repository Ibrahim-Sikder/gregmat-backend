import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import type { ITest } from '@practice/interfaces/test.interface';
import TestModel from '@practice/models/test.schema';
import { PairingAttemptModel } from '@practice/models/pairingAttempt.schema';
import { SentenceFunctionAttemptModel } from '@practice/models/sentenceFunctionAttempt.schema';
import { SupportContrastAttemptModel } from '@practice/models/supportContrastAttempt.schema';
import mongoose from 'mongoose';

class PracticeService {
    private model = TestModel;

    async getPracticeSummary(userId: string): Promise<any> {
        const userObjId = new mongoose.Types.ObjectId(userId);

        // Pairing Stats
        const pairingStats = await PairingAttemptModel.aggregate([
            { $match: { user: userObjId } },
            {
                $group: {
                    _id: '$pairing',
                    maxScore: { $max: '$score' },
                },
            },
            {
                $group: {
                    _id: null,
                    totalScore: { $sum: '$maxScore' },
                    attempted: { $sum: 1 },
                },
            },
        ]);

        // Sentence Function Stats
        const sfStats = await SentenceFunctionAttemptModel.aggregate([
            { $match: { user: userObjId } },
            {
                $group: {
                    _id: '$sentence_function',
                    wasCorrect: { $max: { $cond: [{ $eq: ['$correct', true] }, 1, 0] } },
                },
            },
            {
                $group: {
                    _id: null,
                    score: { $sum: '$wasCorrect' },
                    attempted: { $sum: 1 },
                },
            },
        ]);

        // Support Contrast Stats
        const scStats = await SupportContrastAttemptModel.aggregate([
            { $match: { user: userObjId } },
            {
                $group: {
                    _id: { q: '$support_contrast', b: '$blank_index' },
                    wasCorrect: { $max: { $cond: [{ $eq: ['$correct', true] }, 1, 0] } },
                },
            },
            {
                $group: {
                    _id: null,
                    score: { $sum: '$wasCorrect' },
                    attempted: { $sum: 1 },
                },
            },
        ]);

        const pairingScore = pairingStats[0]
            ? (pairingStats[0].totalScore / (pairingStats[0].attempted * 2 || 1)) * 100
            : 0;
        const sfScore = sfStats[0] ? (sfStats[0].score / (sfStats[0].attempted || 1)) * 100 : 0;
        const scScore = scStats[0] ? (scStats[0].score / (scStats[0].attempted || 1)) * 100 : 0;

        return {
            pairing: {
                score: pairingScore.toFixed(2),
                formatted: `My Score: ${pairingScore.toFixed(2)}%`,
            },
            sentenceFunction: {
                score: sfScore.toFixed(2),
                formatted: `My Score: ${sfScore.toFixed(2)}%`,
            },
            supportContrast: {
                score: scScore.toFixed(0),
                formatted: `My Score: ${scScore.toFixed(0)}%`,
            },
        };
    }

    async createTest(data: ITest): Promise<ITest> {
        const slug = Helpers.slugify(data.title);

        return await this.model.create({ ...data, slug });
    }

    async getTestById(id: string): Promise<ITest | null> {
        const isValidId = Helpers.isValidObjectId(id);

        const query = isValidId ? { _id: id } : { slug: id };

        const test = await this.model.findOne(query);

        if (!test) {
            throw new BadRequestError('Test not found');
        }

        return test;
    }

    async getAllTests(query: Record<string, any> = {}): Promise<ITest[]> {
        return await this.model.find(query);
    }

    async updateTest(id: string, data: ITest): Promise<ITest | null> {
        if (!(await this.model.findById(id))) throw new BadRequestError('Test not found');

        if (data.title) {
            data.slug = Helpers.slugify(data.title);
        }

        return await this.model.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteTest(id: string): Promise<ITest | null> {
        const test = await this.model.findById(id);
        if (!test) throw new BadRequestError('Test not found');

        await this.model.findByIdAndDelete(id);

        return null;
    }
}

const practiceService = new PracticeService();
export default practiceService;
