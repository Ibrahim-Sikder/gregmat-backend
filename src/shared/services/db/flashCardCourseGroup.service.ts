import type { IFlashCardCourseGroup } from '@flashCard/interfaces/flashCard.interface';
import FlashCardCourseModel from '@flashCard/models/course.schema';
import FlashCardCourseGroupModel from '@flashCard/models/courseGroup.schema';
import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import withTransaction from '@global/helpers/withTransaction';

class FlashCardCourseGroupService {
    private model = FlashCardCourseGroupModel;

    async create(data: IFlashCardCourseGroup): Promise<IFlashCardCourseGroup> {
        const slug = Helpers.slugify(data.title);
        const flashCardCourseGroup = new this.model({ ...data, slug });
        return await flashCardCourseGroup.save();
    }

    async getByIdOrSlug(id: string): Promise<IFlashCardCourseGroup | null> {
        const isValidId = Helpers.isValidObjectId(id);
        const query = isValidId ? { _id: id } : { slug: id };

        const flashCardCourseGroup = await this.model.findOne(query).populate({
            path: 'courses',
            populate: {
                path: 'classgroups',
                populate: {
                    path: 'classes',
                    options: { sort: { session_number: 1 } },
                },
                options: { sort: { order: 1 } },
            },
            options: { sort: { order: 1 } },
        });

        if (!flashCardCourseGroup) {
            throw new BadRequestError('FlashCard course group not found');
        }

        return flashCardCourseGroup;
    }

    async getAll(query: Record<string, any>): Promise<any> {
        return await this.model.find(query).sort({ order: 1 }).select('-courses');
    }

    async update(
        id: string,
        data: Partial<IFlashCardCourseGroup>
    ): Promise<IFlashCardCourseGroup | null> {
        const flashCardCourseGroup = await this.model.findById(id);
        if (!flashCardCourseGroup) {
            throw new BadRequestError('FlashCard course group not found');
        }

        const updateData = { ...data };
        if (data.title) {
            updateData.slug = Helpers.slugify(data.title);
        }

        return await this.model.findByIdAndUpdate(id, updateData, { new: true }).populate({
            path: 'courses',
            populate: {
                path: 'classgroups',
                populate: {
                    path: 'classes',
                    options: { sort: { session_number: 1 } },
                },
                options: { sort: { order: 1 } },
            },
            options: { sort: { order: 1 } },
        });
    }

    async delete(id: string): Promise<IFlashCardCourseGroup | null> {
        return await withTransaction(async (session) => {
            const flashCardCourseGroup = await this.model.findByIdAndDelete(id, { session });
            if (!flashCardCourseGroup) {
                throw new BadRequestError('FlashCard course group not found');
            }

            // Optionally delete associated courses
            if (flashCardCourseGroup.courses && flashCardCourseGroup.courses.length > 0) {
                await FlashCardCourseModel.deleteMany(
                    { _id: { $in: flashCardCourseGroup.courses } },
                    { session }
                );
            }

            return flashCardCourseGroup;
        });
    }

    async getCourses(courseGroupId: string): Promise<any | null> {
        const isValidId = Helpers.isValidObjectId(courseGroupId);
        const query = isValidId ? { _id: courseGroupId } : { slug: courseGroupId };
        //    only return the courses in the course group
        const courseGroup = await this.model.findOne(query).populate({
            path: 'courses',
            options: { sort: { order: 1 } },
        });

        if (!courseGroup) {
            throw new BadRequestError('FlashCard course group not found');
        }

        return courseGroup.courses;
    }
}

const flashCardCourseGroupService = new FlashCardCourseGroupService();
export default flashCardCourseGroupService;
