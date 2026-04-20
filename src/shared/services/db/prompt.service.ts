import { Query, Search } from '@global/decorators/query.decorators';
import { BadRequestError } from '@global/helpers/error-handlers';
import type { IPrompt } from '@practice/interfaces/writeEssay.interface';
import { PromptModel } from '@practice/models/writeEssay.model';
import UserModel from '@user/models/user.schema';

class PromptService {
    private model = PromptModel;

    private userModel = UserModel;

    async createPrompt(userId: string, data: IPrompt): Promise<IPrompt> {
        const { body, promptType } = data;

        const user = await this.userModel.findOne({ _id: userId });

        const lastPrompt = await this.model.findOne().sort({ id: -1 });
        const newId = lastPrompt ? lastPrompt.id + 1 : 1000;

        const prompt = await this.model.create({
            id: newId,
            body,
            promptType,
            accessType: user?.role === 'admin' ? 'Our Prompt' : 'User Prompt',
            userId,
        });
        return prompt;
    }

    async getPromptById(id: string | number): Promise<IPrompt | null> {
        const prompt = await this.model.findOne({ _id: id });

        if (!prompt) throw new BadRequestError('Prompt not found');

        return prompt;
    }

    async getAllPrompts(query: Record<string, any> = {}): Promise<IPrompt[]> {
        const search = query.search;
        return await this.model.find({
            accessType: 'Our Prompt',
            ...(search ? { body: { $regex: search, $options: 'i' } } : {}),
        });
    }

    async getUserPrompts(userId: string): Promise<IPrompt[]> {
        return await this.model.find({ userId, accessType: 'User Prompt' });
    }

    async updatePrompt(id: string | number, data: Partial<IPrompt>): Promise<IPrompt | null> {
        const prompt = await this.model.findOne({ _id: id });
        if (!prompt) throw new BadRequestError('Prompt not found');

        Object.assign(prompt, data);

        return await prompt.save();
    }

    async deletePrompt(id: string | number): Promise<null> {
        const prompt = await this.model.findOne({ _id: id });
        if (!prompt) throw new BadRequestError('Prompt not found');
        await this.model.deleteOne({ _id: id });

        return null;
    }
}

const promptService = new PromptService();
export default promptService;
