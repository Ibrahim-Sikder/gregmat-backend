import { Query } from '@global/decorators/query.decorators';
import { BadRequestError, NotFoundError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import type { ICourse } from '@recordings/interfaces/course.interface';
import CourseModel from '@recordings/models/course.schema';
import SeriesModel from '@recordings/models/series.schema';
import type { CourseInput } from '@recordings/schemas/course';

class CourseService {
    private model = CourseModel;

    private seriesModel = SeriesModel;

    public async createCourse(data: CourseInput): Promise<ICourse> {
        const series = await this.seriesModel.findById(data.seriesId);
        if (!series) {
            throw new NotFoundError('This series does not exist');
        }

        const slug = Helpers.slugify(data.title);
        const course = await this.model.create({ ...data, slug });

        if (course) {
            await this.seriesModel.findByIdAndUpdate(data.seriesId, {
                $push: { courses: course._id },
            });
        }
        return course;
    }

    @Query()
    public async getAllCourses(query: any): Promise<ICourse[]> {
        const result = await this.model
            .find(query)
            .populate('seriesId', 'title slug')
            .sort({ order: 1, createdAt: -1 });
        return result;
    }

    public async getCourseById(courseId: string): Promise<ICourse | null> {
        const result = await this.model.findById(courseId);
        return result;
    }

    public async updateCourse(courseId: string, data: CourseInput): Promise<ICourse | null> {
        if (data.title) {
            data.slug = Helpers.slugify(data.title);
        }

        const result = await this.model.findByIdAndUpdate(courseId, data, { new: true });
        if (!result) {
            throw new BadRequestError('Something went wrong. Please try again.');
        }
        if (data.seriesId) {
            await this.seriesModel.findByIdAndUpdate(data.seriesId, {
                $addToSet: { courses: result._id },
            });
        }

        return result;
    }

    public async deleteCourse(courseId: string): Promise<ICourse | null> {
        const course = await this.model.findById(courseId);
        if (!course) {
            throw new NotFoundError('Course not found');
        }
        await this.seriesModel.findByIdAndUpdate(course.seriesId, {
            $pull: { courses: course._id },
        });
        await this.model.findByIdAndDelete(courseId);
        return null;
    }

    public async getCourseBySlug(slug: string): Promise<ICourse | null> {
        const result = await this.model
            .findOne({ slug })
            .populate([
                {
                    path: 'groups',
                    select: '-__v -updatedAt -createdAt -courseId -order',
                    populate: {
                        path: 'classes',
                        select: '-__v -updatedAt -createdAt -groupId -order -video -homeworks',
                    },
                },
            ])
            .sort({ order: 1, createdAt: -1 })
            .select('-__v -updatedAt -createdAt -seriesId -order');
        return result;
    }

    public async getCoursesBySeriesId(seriesId: string): Promise<ICourse[]> {
        const isValidId = Helpers.isValidObjectId(seriesId);
        const query = isValidId ? { _id: seriesId } : { slug: seriesId };

        const series = await this.seriesModel.findOne(query).lean();
        if (!series) {
            throw new NotFoundError('Series not found');
        }

        const result = await this.model
            .find({ seriesId: series._id })
            .populate([
                {
                    path: 'seriesId',
                    select: 'title slug',
                },
                {
                    path: 'groups',
                    select: '-__v -updatedAt -createdAt -courseId -order',
                    populate: {
                        path: 'classes',
                        select: '-__v -updatedAt -createdAt -groupId -order -video -homeworks',
                    },
                },
            ])
            .sort({ order: 1, createdAt: -1 })
            .select('-__v -updatedAt -createdAt');
        return result;
    }
}

const courseService = new CourseService();
export default courseService;
