import type { IPrepswiftCourse, ICourseWithFullData } from '@prepswift/interfaces/course.interface';
import PrepswiftCourseModel from '@prepswift/models/course.schema';
import type { PrepswiftCourse } from '@prepswift/schemas/course';
import prepswiftCategoryService from '@service/db/prepswiftCategory.service';
import prepswiftContentService from '@service/db/prepswiftContent.service';
import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import withTransaction from '@global/helpers/withTransaction';

class PrepswiftCourseService {
    private model = PrepswiftCourseModel;

    async create(data: PrepswiftCourse): Promise<IPrepswiftCourse> {
        return await withTransaction(async (session) => {
            const slug = Helpers.slugify(data.title);

            // Check if course with same slug exists
            const existingCourse = await this.model.findOne({ slug });
            if (existingCourse) {
                throw new BadRequestError('Course with this slug already exists');
            }

            const prepswiftCourse = new this.model({
                ...data,
                slug,
            });

            return await prepswiftCourse.save({ session });
        });
    }

    async getByIdOrSlug(id: string, userId?: string): Promise<any> {
        const isValidId = Helpers.isValidObjectId(id);
        const query = isValidId ? { _id: id } : { slug: id };

        const prepswiftCourse = (await this.model.findOne(query)) as any;

        if (!prepswiftCourse) {
            throw new BadRequestError('Prepswift course not found');
        }

        // Get all categories for this course
        const categories = await prepswiftCategoryService.getByCourseId(
            prepswiftCourse._id.toString()
        );

        // Get all contents for each category with user progress if userId is provided
        const categoriesWithContents = await Promise.all(
            categories.map(async (category: any) => {
                const contents = await prepswiftContentService.getByCategoryId(
                    category._id.toString(),
                    userId
                );
                return {
                    ...category,
                    contents,
                };
            })
        );

        return {
            ...prepswiftCourse.toObject(),
            categories: categoriesWithContents,
        };
    }

    async getAll(query: Record<string, any>): Promise<IPrepswiftCourse[]> {
        return await this.model.find(query).select('-__v');
    }

    async update(id: string, data: Partial<PrepswiftCourse>): Promise<IPrepswiftCourse | null> {
        const prepswiftCourse = await this.model.findById(id);
        if (!prepswiftCourse) {
            throw new BadRequestError('Prepswift course not found');
        }

        const updateData = { ...data };
        if (data.title) {
            updateData.slug = Helpers.slugify(data.title);

            // Check if slug already exists for another course
            const existingCourse = await this.model.findOne({
                slug: updateData.slug,
                _id: { $ne: id },
            });
            if (existingCourse) {
                throw new BadRequestError('Course with this slug already exists');
            }
        }

        return await this.model.findByIdAndUpdate(id, updateData, { new: true });
    }

    async delete(id: string): Promise<IPrepswiftCourse | null> {
        return await withTransaction(async (session) => {
            const prepswiftCourse = await this.model.findByIdAndDelete(id, { session });
            if (!prepswiftCourse) {
                throw new BadRequestError('Prepswift course not found');
            }

            // Delete all associated categories and contents
            await prepswiftContentService.deleteByCourseId(id);
            await prepswiftCategoryService.deleteByCourseId(id);

            return prepswiftCourse;
        });
    }
}

const prepswiftCourseService = new PrepswiftCourseService();
export default prepswiftCourseService;
