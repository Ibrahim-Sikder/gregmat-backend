import { Pagination, Query, Search } from '@global/decorators/query.decorators';
import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import withTransaction from '@global/helpers/withTransaction';
import type {
    IFlashCardClass,
    IFlashCardClassGroup,
} from '@flashCard/interfaces/flashCard.interface';
import FlashCardClassGroupModel from '@flashCard/models/classGroup.schema';
import FlashCardClassModel from '@flashCard/models/class.schema';
import FlashCardCourseModel from '@flashCard/models/course.schema';
import type { FlashCardClassGroup } from '@flashCard/schemas/classGroup';

class FlashCardClassGroupService {
    private model = FlashCardClassGroupModel;

    private courseModel = FlashCardCourseModel;

    async createFlashCardClassGroup(data: FlashCardClassGroup): Promise<IFlashCardClassGroup> {
        const { courseId } = data;
        return await withTransaction(async (session) => {
            const course = await this.courseModel.findById(courseId).session(session);
            if (!course) {
                throw new BadRequestError('Associated course not found');
            }

            const slug = Helpers.slugify(data.title);
            const flashCardClassGroup = new this.model({ ...data, slug });
            const savedClassGroup = await flashCardClassGroup.save({ session });

            await this.courseModel.findByIdAndUpdate(
                courseId,
                { $push: { classgroups: savedClassGroup._id } },
                { session }
            );

            return savedClassGroup.populate({
                path: 'classes',
                options: { sort: { session_number: 1 } },
            });
        });
    }

    async getFlashCardClassGroupById(id: string): Promise<IFlashCardClassGroup | null> {
        const isValidId = Helpers.isValidObjectId(id);
        const query = isValidId ? { _id: id } : { slug: id };

        const flashCardClassGroup = await this.model.findOne(query).populate({
            path: 'classes',
            options: { sort: { session_number: 1 } },
        });

        if (!flashCardClassGroup) {
            throw new BadRequestError('FlashCard class group not found');
        }

        return flashCardClassGroup;
    }

    async getClassesInClassGroup(classGroupId: string): Promise<IFlashCardClass[] | null> {
        const flashCardClassGroup = await this.model.findById(classGroupId).populate({
            path: 'classes',
            options: { sort: { session_number: 1 } },
        });

        if (!flashCardClassGroup) {
            throw new BadRequestError('FlashCard class group not found');
        }

        return flashCardClassGroup.classes;
    }

    @Query()
    @Search(['title', 'description'])
    @Pagination()
    async getAllFlashCardClassGroups(query: Record<string, any>): Promise<any> {
        return await this.model
            .find(query)
            .populate({
                path: 'classes',
                options: { sort: { session_number: 1 } },
            })
            .sort({ order: 1 });
    }

    async updateFlashCardClassGroup(
        id: string,
        data: Partial<IFlashCardClassGroup>
    ): Promise<IFlashCardClassGroup | null> {
        const flashCardClassGroup = await this.model.findById(id);
        if (!flashCardClassGroup) {
            throw new BadRequestError('FlashCard class group not found');
        }

        const updateData = { ...data };
        if (data.title) {
            updateData.slug = Helpers.slugify(data.title);
        }

        return await this.model.findByIdAndUpdate(id, updateData, { new: true }).populate({
            path: 'classes',
            options: { sort: { session_number: 1 } },
        });
    }

    async deleteFlashCardClassGroup(
        id: string,
        courseId: string
    ): Promise<IFlashCardClassGroup | null> {
        return await withTransaction(async (session) => {
            const flashCardClassGroup = await this.model.findByIdAndDelete(id, { session });
            if (!flashCardClassGroup) {
                throw new BadRequestError('FlashCard class group not found');
            }

            const course = await this.courseModel.findById(courseId).session(session);
            if (!course) {
                throw new BadRequestError('Associated course not found');
            }

            await this.courseModel.findByIdAndUpdate(
                courseId,
                { $pull: { classgroups: flashCardClassGroup._id } },
                { session }
            );

            // Optionally delete associated classes
            if (flashCardClassGroup.classes && flashCardClassGroup.classes.length > 0) {
                await FlashCardClassModel.deleteMany(
                    { _id: { $in: flashCardClassGroup.classes } },
                    { session }
                );
            }

            return flashCardClassGroup;
        });
    }
}

const flashCardClassGroupService = new FlashCardClassGroupService();
export default flashCardClassGroupService;
