import type { IFlashCardCourse } from '@flashCard/interfaces/flashCard.interface';
import FlashCardClassGroupModel from '@flashCard/models/classGroup.schema';
import FlashCardCourseModel from '@flashCard/models/course.schema';
import FlashCardCourseGroupModel from '@flashCard/models/courseGroup.schema';
import type { FlashCardCourse } from '@flashCard/schemas/course';
import { Pagination, Query, Search } from '@global/decorators/query.decorators';
import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import withTransaction from '@global/helpers/withTransaction';

class FlashCardCourseService {
    private model = FlashCardCourseModel;

    private courseGroupModel = FlashCardCourseGroupModel;

    async create(data: FlashCardCourse): Promise<IFlashCardCourse> {
        const { courseGroupId, ...rest } = data;

        const groupExists = await this.courseGroupModel.findById(courseGroupId);
        if (!groupExists) {
            throw new BadRequestError('FlashCard course group not found');
        }

        return await withTransaction(async (session) => {
            const slug = Helpers.slugify(data.title);
            const flashCardCourse = new this.model({ ...rest, slug, courseGroupId });

            await this.courseGroupModel.findByIdAndUpdate(
                courseGroupId,
                {
                    $push: { courses: flashCardCourse._id },
                },
                { session }
            );

            return await flashCardCourse.save({ session });
        });
    }

    async getByIdOrSlug(id: string): Promise<IFlashCardCourse | null> {
        const isValidId = Helpers.isValidObjectId(id);
        const query = isValidId ? { _id: id } : { slug: id };

        const flashCardCourse = await this.model.findOne(query).populate({
            path: 'classgroups',
            populate: {
                path: 'classes',
                options: { sort: { session_number: 1 } },
            },
            options: { sort: { order: 1 } },
        });

        if (!flashCardCourse) {
            throw new BadRequestError('FlashCard course not found');
        }

        return flashCardCourse;
    }

    @Query()
    @Search(['title', 'description'])
    @Pagination()
    async getAll(query: Record<string, any>): Promise<any> {
        return await this.model
            .find(query)
            .populate({
                path: 'classgroups',
                populate: {
                    path: 'classes',
                    options: { sort: { session_number: 1 } },
                },
                options: { sort: { order: 1 } },
            })
            .sort({ order: 1 });
    }

    async update(id: string, data: Partial<IFlashCardCourse>): Promise<IFlashCardCourse | null> {
        const flashCardCourse = await this.model.findById(id);
        if (!flashCardCourse) {
            throw new BadRequestError('FlashCard course not found');
        }

        const updateData = { ...data };
        if (data.title) {
            updateData.slug = Helpers.slugify(data.title);
        }

        return await this.model.findByIdAndUpdate(id, updateData, { new: true }).populate({
            path: 'classgroups',
            populate: {
                path: 'classes',
                options: { sort: { session_number: 1 } },
            },
            options: { sort: { order: 1 } },
        });
    }

    async delete(id: string, courseGroupId: string): Promise<IFlashCardCourse | null> {
        return await withTransaction(async (session) => {
            const flashCardCourse = await this.model.findByIdAndDelete(id, { session });
            if (!flashCardCourse) {
                throw new BadRequestError('FlashCard course not found');
            }

            const courseGroup = await this.courseGroupModel.findById(courseGroupId);
            if (!courseGroup) {
                throw new BadRequestError('FlashCard course group not found');
            }

            await FlashCardClassGroupModel.deleteMany(
                { _id: { $in: flashCardCourse.classgroups } },
                { session }
            );

            await this.courseGroupModel.findByIdAndUpdate(
                courseGroupId,
                {
                    $pull: { courses: flashCardCourse._id },
                },
                { session }
            );

            return flashCardCourse;
        });
    }

    async getCourseGroups(id: string): Promise<any | null> {
        //    only return the courses in the course group
        const course = await this.model.findById(id).populate({
            path: 'classgroups',
            populate: {
                path: 'classes',
                options: { sort: { session_number: 1 } },
            },
            options: { sort: { order: 1 } },
        });
        if (!course) {
            throw new BadRequestError('FlashCard course not found');
        }

        return course.classgroups;
    }
}

const flashCardCourseService = new FlashCardCourseService();
export default flashCardCourseService;
