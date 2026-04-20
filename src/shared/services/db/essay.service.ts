import { BadRequestError } from '@global/helpers/error-handlers';
import type { IEssay } from '@practice/interfaces/writeEssay.interface';
import { EssayModel, PromptModel } from '@practice/models/writeEssay.model';
import essayQueue from '@service/queues/essay.queue';

class EssayService {
    private model = EssayModel;

    private promptModel = PromptModel;

    async createEssay(data: IEssay): Promise<{ essay: IEssay; feedback: any }> {
        const { promptId, promptBody } = data;

        if (!data.userId) throw new BadRequestError('userId is required');
        if (!data.essayContent) throw new BadRequestError('essayContent is required');

        let prompt = null;
        if (promptId) {
            prompt = await this.promptModel.findById(promptId);
            if (!prompt) throw new BadRequestError(`Prompt not found for id ${promptId}`);
        }

        if (promptBody) {
            const userPrompt = await this.promptModel.create({
                body: promptBody,
                accessType: 'User Prompt',
                promptType: 'Argument',
                userId: data.userId,
            });
            data.promptId = userPrompt._id as any;
            data.promptBody = userPrompt.body;
            prompt = userPrompt;
        } else if (prompt) {
            data.promptBody = prompt.body;
        } else {
            throw new BadRequestError('Either promptId or promptBody must be provided');
        }

        if (!data.wordCount || data.wordCount === 0) {
            data.wordCount = data.essayContent.trim().split(/\s+/).filter(Boolean).length;
        }

        const created = await this.model.create(data);

        try {
            essayQueue.addEssayJob('generateEssayFeedback', {
                essayId: created._id.toString(),
                essayContent: data.essayContent,
                promptBody: data.promptBody,
            });
        } catch (err: any) {
            // If queueing fails, surface a warning but don't block essay creation
            throw new BadRequestError(`Failed to enqueue feedback job: ${err.message}`);
        }

        return { essay: created, feedback: null };
    }

    async updateEssayFeedback(essayId: string, feedback: any): Promise<void> {
        if (!essayId) throw new BadRequestError('essayId is required');
        await this.model.updateOne({ _id: essayId }, { $set: { feedback } }).exec();
    }

    async getEssayById(id: string): Promise<IEssay | null> {
        const essay = await this.model.findOne({ _id: id });
        if (!essay) throw new BadRequestError('Essay not found');
        return essay;
    }

    async getEssaysByUser(userId: string): Promise<IEssay[]> {
        if (!userId) throw new BadRequestError('userId is required');
        const essays = await this.model.find({ userId }).sort({ createdAt: -1 });
        return essays;
    }
}

const essayService = new EssayService();
export default essayService;
