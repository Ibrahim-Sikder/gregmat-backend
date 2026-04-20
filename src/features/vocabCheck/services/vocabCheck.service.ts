import { VocabCheck } from '../models/VocabCheck';
import { MountainContent, MountainCategory } from '@mountain/models';
import geminiService from '@service/ai/gemini.service';
import { Types } from 'mongoose';

class VocabCheckService {
    public async listVocabChecks(userId: string, query: any): Promise<any> {
        const { limit = 20, offset = 0 } = query;
        const checks = await VocabCheck.find({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .skip(Number(offset))
            .limit(Number(limit));

        const count = await VocabCheck.countDocuments({ userId: new Types.ObjectId(userId) });

        const results = checks.map((c) => ({
            id: c._id,
            created_at: c.createdAt,
            word_count: c.words.length,
            groups: c.groups,
            attempts: c.attempts.map((a) => ({
                id: a.id,
                created_at: a.created_at,
                first: a.first,
                graded: a.graded,
                score: a.score,
            })),
        }));

        return {
            count,
            next: null,
            previous: null,
            results,
        };
    }

    public async createVocabCheck(userId: string, body: any): Promise<any> {
        const { mountainId, categoryIds, wordCount = 20 } = body;

        // Fetch words from these categories
        const words = await MountainContent.aggregate([
            {
                $match: {
                    mountainId: new Types.ObjectId(mountainId),
                    categoryId: { $in: categoryIds.map((id: string) => new Types.ObjectId(id)) },
                    unlisted: { $ne: true },
                },
            },
            { $sample: { size: Number(wordCount) } },
        ]);

        if (words.length === 0) {
            throw new Error('No words found for selected groups.');
        }

        // Fetch group details
        const categories = await MountainCategory.find({
            _id: { $in: categoryIds.map((id: string) => new Types.ObjectId(id)) },
        });

        const newCheck = new VocabCheck({
            userId: new Types.ObjectId(userId),
            words: words.map((w) => ({
                id: w._id,
                word: w.title,
                definition: w.description,
            })),
            groups: categories.map((c) => ({
                id: c._id,
                number: c.order,
            })),
            attempts: [],
        });

        await newCheck.save();
        return newCheck;
    }

    public async getVocabCheck(userId: string, id: string): Promise<any> {
        const check = await VocabCheck.findOne({
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId),
        });

        if (!check) {
            throw new Error('Vocab check not found.');
        }

        return check;
    }

    public async submitAttempt(userId: string, id: string, body: any): Promise<any> {
        const { word_attempts } = body;
        const check = await VocabCheck.findOne({
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId),
        });

        if (!check) {
            throw new Error('Vocab check not found.');
        }

        const gradedAttempts = [];
        let totalScore = 0;

        for (const attempt of word_attempts) {
            const wordInfo = check.words.find((w) => w.id.toString() === attempt.wordId);
            if (!wordInfo) continue;

            const evaluation = await geminiService.evaluateVocabDefinition(
                wordInfo.word,
                wordInfo.definition,
                attempt.given_definition || attempt.definition || ''
            );

            gradedAttempts.push({
                word: wordInfo.id,
                given_definition: attempt.given_definition || attempt.definition,
                gpt_score: evaluation.score,
                gpt_comment: evaluation.comment,
                reported: false,
            });

            totalScore += evaluation.score;
        }

        const finalScore = word_attempts.length > 0 ? (totalScore / word_attempts.length) * 100 : 0;

        const newAttempt = {
            id: new Types.ObjectId(),
            created_at: new Date(),
            first: check.attempts.length === 0,
            graded: true,
            score: Math.round(finalScore),
            word_attempts: gradedAttempts,
        };

        check.attempts.push(newAttempt as any);
        await check.save();

        return newAttempt;
    }
}

export const vocabCheckService = new VocabCheckService();
