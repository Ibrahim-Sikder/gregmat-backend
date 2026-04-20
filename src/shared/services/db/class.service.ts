import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import type { TMeta } from '@global/helpers/sendResponse';
import type { IClass } from '@recordings/interfaces/class.interface';
import ClassModel from '@recordings/models/class.schema';
import CourseModel from '@recordings/models/course.schema';
import ClassGroupModel from '@recordings/models/group.schema';
import type { ClassInput } from '@recordings/schemas/class';

class ClassService {
    private model = ClassModel;

    private groupModel = ClassGroupModel;

    async createClass(data: ClassInput): Promise<IClass> {
        const group = await this.groupModel.findById(data.groupId);

        const slug = Helpers.slugify(data.title);

        const result = await this.model.create({ ...data, slug });
        if (group) {
            if (result) {
                await this.groupModel.findByIdAndUpdate(data.groupId, {
                    $push: { classes: result._id },
                });
            }
        }

        return result;
    }

    async getAllClasses(): Promise<IClass[]> {
        return await this.model.find().populate('groupId', 'title slug').sort({ createdAt: -1 });
    }

    async getClassById(classId: string): Promise<IClass | any> {
        const isValidId = Helpers.isValidObjectId(classId);
        const query = isValidId ? { _id: classId } : { slug: classId };

        const currentClass = await ClassModel.findOne(query).lean();
        if (!currentClass) {
            throw new Error('Class not found');
        }

        // 🚨 No group attached
        if (!currentClass.groupId) {
            return {
                current: {
                    ...currentClass,
                    course: null,
                },
                prev: null,
                next: null,
            };
        }

        const group = await ClassGroupModel.findById(currentClass.groupId).lean();
        if (!group) {
            return {
                current: {
                    ...currentClass,
                    course: null,
                },
                prev: null,
                next: null,
            };
        }

        const course = await CourseModel.findById(group.courseId).lean();
        if (!course) {
            return {
                current: {
                    ...currentClass,
                    course: null,
                },
                prev: null,
                next: null,
            };
        }

        const groups = await ClassGroupModel.find({
            _id: { $in: course.groups },
        })
            .sort({ order: 1 })
            .populate({
                path: 'classes',
                options: { sort: { order: 1 } },
            })
            .lean();

        const allClasses = groups.flatMap((g: any) => g.classes);

        const index = allClasses.findIndex(
            (cls: any) => cls._id.toString() === currentClass._id.toString()
        );

        return {
            current: {
                ...currentClass,
                course: { _id: course._id, title: course.title, slug: course.slug },
            },
            prev: index > 0 ? allClasses[index - 1] : null,
            next: index < allClasses.length - 1 ? allClasses[index + 1] : null,
        };
    }

    async getClassBySlug(slug: string): Promise<IClass | null> {
        return await this.model.findOne({ slug });
    }

    async updateClass(classId: string, data: any): Promise<any> {
        if (!(await this.model.exists({ _id: classId }))) {
            throw new BadRequestError('Class not found');
        }

        if (data.title) {
            data.slug = Helpers.slugify(data.title);
        }

        const result = await this.model.findByIdAndUpdate(classId, data, { new: true });

        if (result && data.groupId) {
            await this.groupModel.findByIdAndUpdate(data.groupId, {
                $addToSet: { classes: result._id },
            });
        }

        return result;
    }

    async deleteClass(classId: string): Promise<any> {
        const classDoc = await this.model.findByIdAndDelete(classId);
        if (!classDoc) throw new BadRequestError('This class does not exist');

        await this.groupModel.findByIdAndUpdate(classDoc.groupId, {
            $pull: { classes: classDoc._id },
        });

        await this.model.findByIdAndDelete(classId);
        return null;
    }

    async getClassesByGroupId(groupId: string): Promise<IClass[]> {
        return await this.model.find({ groupId }).populate('groupId', 'title slug');
    }

    async contentFeed(query: Record<string, any>): Promise<{ result: IClass[]; meta: TMeta }> {
        const { limit, page } = query;

        const result = await this.model
            .find({
                classType: { $nin: ['Other'] },
            })
            .sort({ createdAt: -1, thumbnailSize: 1 })
            .select('title slug img thumbnail createdAt thumbnailSize plusOnly')
            .limit(limit || 10)
            .skip((page - 1) * (limit || 10));

        const meta = {
            page: page || 1,
            limit: limit || 10,
            total: await this.model.countDocuments({ classType: { $nin: ['Other'] } }),
            totalPage: Math.ceil(
                (await this.model.countDocuments({ classType: { $nin: ['Other'] } })) /
                    (limit || 10)
            ),
        };

        return { result, meta };
    }
}

const classService = new ClassService();
export default classService;
