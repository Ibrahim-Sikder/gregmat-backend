import type { ICategory } from '@prepswift/interfaces/course.interface';
import PrepswiftCategoryModel from '@prepswift/models/category.schema';
import type { PrepswiftCategory } from '@prepswift/schemas/category';
import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import withTransaction from '@global/helpers/withTransaction';
import PrepswiftContentModel from '@prepswift/models/content.schema';

class PrepswiftCategoryService {
    private model = PrepswiftCategoryModel;

    private contentModel = PrepswiftContentModel;

    async create(data: PrepswiftCategory): Promise<ICategory> {
        return await withTransaction(async (session) => {
            const slug = data.slug || Helpers.slugify(data.title);

            // Check if category with same slug exists
            const existingCategory = await this.model.findOne({ slug });
            if (existingCategory) {
                throw new BadRequestError('Category with this slug already exists');
            }

            const category = new this.model({
                ...data,
                slug,
            });

            return await category.save({ session });
        });
    }

    async getById(id: string): Promise<ICategory | null> {
        const category = await this.model.findById(id);
        if (!category) {
            throw new BadRequestError('Category not found');
        }
        return category;
    }

    async getBySlug(slug: string): Promise<ICategory | null> {
        const category = await this.model.findOne({ slug });
        if (!category) {
            throw new BadRequestError('Category not found');
        }
        return category;
    }

    async getByCourseId(courseId: string): Promise<any> {
        if (!Helpers.isValidObjectId(courseId)) {
            throw new BadRequestError('Invalid course ID');
        }
        const categories = await this.model.find({ courseId }).sort({ createdAt: 1 });

        const categoriesWithContentCount = await Promise.all(
            categories.map(async (category) => {
                const contentCount = await this.contentModel.countDocuments({
                    categoryId: category._id,
                });
                return {
                    ...category.toObject(),
                    contentCount,
                };
            })
        );

        return categoriesWithContentCount;
    }

    async getAll(query: Record<string, any>): Promise<ICategory[]> {
        return await this.model.find(query).sort({ createdAt: 1 });
    }

    async update(id: string, data: Partial<PrepswiftCategory>): Promise<ICategory | null> {
        const category = await this.model.findById(id);
        if (!category) {
            throw new BadRequestError('Category not found');
        }

        const updateData = { ...data };
        if (data.title) {
            updateData.slug = Helpers.slugify(data.title);

            // Check if slug already exists for another category
            const existingCategory = await this.model.findOne({
                slug: updateData.slug,
                _id: { $ne: id },
            });
            if (existingCategory) {
                throw new BadRequestError('Category with this slug already exists');
            }
        }

        return await this.model.findByIdAndUpdate(id, updateData, { new: true });
    }

    async delete(id: string): Promise<ICategory | null> {
        return await withTransaction(async (session) => {
            const category = await this.model.findByIdAndDelete(id, { session });
            if (!category) {
                throw new BadRequestError('Category not found');
            }
            return category;
        });
    }

    async bulkCreate(categories: PrepswiftCategory[]): Promise<ICategory[]> {
        return await withTransaction(async (session) => {
            const processedCategories = categories.map((category) => ({
                ...category,
                slug: category.slug || Helpers.slugify(category.title),
            }));

            return await this.model.insertMany(processedCategories, { session });
        });
    }

    async deleteByCourseId(courseId: string): Promise<void> {
        await withTransaction(async (session) => {
            await this.model.deleteMany({ courseId }, { session });
        });
    }
}

const prepswiftCategoryService = new PrepswiftCategoryService();
export default prepswiftCategoryService;
