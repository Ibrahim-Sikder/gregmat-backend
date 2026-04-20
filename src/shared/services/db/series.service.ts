import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import withTransaction from '@global/helpers/withTransaction';
import type { ICourseSeries } from '@recordings/interfaces/series.interface';
import SeriesModel from '@recordings/models/series.schema';
import type { SeriesInput } from '@recordings/schemas/series';

class SeriesService {
    private model = SeriesModel;

    public async createSeries(data: SeriesInput): Promise<ICourseSeries> {
        const slug = Helpers.slugify(data.title);
        const result = await this.model.create({ ...data, slug });
        return result;
    }

    public async getAllSeries(query: any): Promise<ICourseSeries[]> {
        const result = await this.model
            .find({ ...query })
            .populate({
                path: 'courses',
                select: 'title slug thumbnailSize img order isActive description',
                match: { isActive: true },
                options: { sort: { order: 1 } },
            })
            .sort({ order: 1 });

        return result;
    }

    public async getSeriesById(seriesId: string): Promise<ICourseSeries | null> {
        const isValidId = Helpers.isValidObjectId(seriesId);
        const query = isValidId ? { _id: seriesId } : { slug: seriesId };

        if (!(await this.model.exists(query))) {
            throw new BadRequestError('Series not found');
        }

        const result = await this.model.findOne(query).populate([
            {
                path: 'courses',
                populate: {
                    path: 'groups',
                    populate: {
                        path: 'classes',
                    },
                },
            },
        ]);
        return result;
    }

    public async updateSeries(seriesId: string, data: SeriesInput): Promise<ICourseSeries | null> {
        if (!(await this.model.exists({ _id: seriesId }))) {
            throw new BadRequestError('Series not found');
        }

        if (data.title) {
            data.slug = Helpers.slugify(data.title);
        }
        if (data.order !== undefined) {
            const existingSeries = await this.model.findOne({ order: data.order });
            if (existingSeries && existingSeries._id.toString() !== seriesId) {
                throw new BadRequestError(`Series with order ${data.order} already exists`);
            }
        }

        const result = await this.model
            .findByIdAndUpdate(seriesId, data, { new: true })
            .populate('courses');
        return result;
    }

    public async deleteSeries(seriesId: string): Promise<ICourseSeries | null> {
        return withTransaction(async (session) => {
            const series = await this.model.findById(seriesId).session(session);
            if (!series) {
                throw new BadRequestError('Series not found');
            }

            if (series.courses && series.courses.length > 0) {
                throw new BadRequestError('Cannot delete series with associated courses');
            }

            const result = await this.model.findByIdAndDelete(seriesId).session(session);
            if (!result) {
                throw new BadRequestError('Something went wrong. Please try again.');
            }
            return result;
        });
    }
}

const seriesService = new SeriesService();
export default seriesService;
