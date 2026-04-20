import { Pagination, Query, Search } from '@global/decorators/query.decorators';
import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import type { IFlashCardClass } from '@flashCard/interfaces/flashCard.interface';
import FlashCardClassModel from '@flashCard/models/class.schema';
import type { FlashCardClass } from '@flashCard/schemas/class';
import withTransaction from '@global/helpers/withTransaction';
import FlashCardClassGroupModel from '@flashCard/models/classGroup.schema';

class FlashCardClassService {
    private model = FlashCardClassModel;

    private classGroupModel = FlashCardClassGroupModel;

    async createFlashCardClass(data: FlashCardClass): Promise<IFlashCardClass> {
        const { classGroupId } = data;

        const classGroupExists = await this.classGroupModel.findById(classGroupId);
        if (!classGroupExists) {
            throw new BadRequestError('FlashCard class group not found');
        }

        return await withTransaction(async (session) => {
            const slug = Helpers.slugify(data.title);
            const flashCardClass = new this.model({ ...data, slug });

            await this.classGroupModel.findByIdAndUpdate(
                classGroupId,
                {
                    $push: { classes: flashCardClass._id },
                },
                { session }
            );

            return await flashCardClass.save({ session });
        });
    }

    async getFlashCardClassById(id: string): Promise<IFlashCardClass | null> {
        const isValidId = Helpers.isValidObjectId(id);
        const query = isValidId ? { _id: id } : { slug: id };

        const flashCardClass = await this.model.findOne(query);

        if (!flashCardClass) {
            throw new BadRequestError('FlashCard class not found');
        }

        return flashCardClass;
    }

    @Query()
    @Search(['title', 'description', 'class_type'])
    @Pagination()
    async getAllFlashCardClasses(query: Record<string, any>): Promise<any> {
        return await this.model.find(query).sort({ session_number: 1 });
    }

    async updateFlashCardClass(
        id: string,
        data: Partial<IFlashCardClass>
    ): Promise<IFlashCardClass | null> {
        const flashCardClass = await this.model.findById(id);
        if (!flashCardClass) {
            throw new BadRequestError('FlashCard class not found');
        }

        const updateData = { ...data };
        if (data.title) {
            updateData.slug = Helpers.slugify(data.title);
        }

        return await this.model.findByIdAndUpdate(id, updateData, { new: true });
    }

    async deleteFlashCardClass(id: string, classGroupId: string): Promise<IFlashCardClass | null> {
        const flashCardClass = await this.model.findByIdAndDelete(id);
        if (!flashCardClass) {
            throw new BadRequestError('FlashCard class not found');
        }

        const classGroup = await this.classGroupModel.findById(classGroupId);
        if (!classGroup) {
            throw new BadRequestError('FlashCard class group not found');
        }

        await this.classGroupModel.findByIdAndUpdate(classGroupId, {
            $pull: { classes: flashCardClass._id },
        });

        return flashCardClass;
    }

    async createBulkFlashCardClasses(
        data: FlashCardClass[],
        classGroupId: string
    ): Promise<IFlashCardClass[]> {
        return withTransaction(async (session) => {
            const flashCardClasses: IFlashCardClass[] = [];
            for (const item of data) {
                const slug = Helpers.slugify(item.title);
                const flashCardClass = new this.model({ ...item, slug });
                const savedClass = await flashCardClass.save({ session });
                flashCardClasses.push(savedClass);

                await this.classGroupModel.findByIdAndUpdate(
                    classGroupId,
                    {
                        $push: { classes: savedClass._id },
                    },
                    { session }
                );
            }

            return flashCardClasses;
        });
    }
}

const flashCardClassService = new FlashCardClassService();
export default flashCardClassService;
