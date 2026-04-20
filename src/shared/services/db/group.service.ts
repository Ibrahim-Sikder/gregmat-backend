import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import type { IClassGroup } from '@recordings/interfaces/group.interface';
import CourseModel from '@recordings/models/course.schema';
import GroupModel from '@recordings/models/group.schema';
import type { ClassGroupInput } from '@recordings/schemas/group';

class GroupService {
    private model = GroupModel;

    private courseModel = CourseModel;

    async createGroup(data: ClassGroupInput): Promise<IClassGroup> {
        const course = await this.courseModel.findById(data.courseId);
        if (!course) {
            throw new BadRequestError('This course does not exist');
        }

        const slug = Helpers.slugify(data.title);
        const result = await this.model.create({ ...data, slug });
        if (result) {
            await this.courseModel.findByIdAndUpdate(data.courseId, {
                $push: { groups: result._id },
            });
        }

        return result;
    }

    async getAllGroups(): Promise<any> {
        return await this.model
            .find()
            .populate('courseId', 'title slug')
            .sort({ order: 1, createdAt: -1 });
    }

    async getGroupById(groupId: string): Promise<any> {
        const group = await this.model.findById(groupId);
        if (!group) throw new BadRequestError('Group not found');
        return group;
    }

    async updateGroup(groupId: string, data: any): Promise<any> {
        if (!(await this.model.exists({ _id: groupId }))) {
            throw new BadRequestError('Group not found');
        }

        if (data.title) {
            data.slug = Helpers.slugify(data.title);
        }

        const group = await this.model.findByIdAndUpdate(groupId, data, { new: true });
        if (!group) throw new BadRequestError('Group not found');

        if (data.courseId) {
            await this.courseModel.findByIdAndUpdate(data.courseId, {
                $addToSet: { groups: group._id },
            });
        }

        return group;
    }

    async deleteGroup(groupId: string): Promise<any> {
        const group = await this.model.findByIdAndDelete(groupId);
        if (!group) throw new BadRequestError('Group not found');

        await this.courseModel.findByIdAndUpdate(group.courseId, {
            $pull: { groups: group._id },
        });

        await this.model.findByIdAndDelete(groupId);
        return null;
    }

    async getGroupsByCourseId(courseId: string): Promise<IClassGroup[]> {
        return await this.model.find({ courseId }).populate('courseId', 'title slug description');
    }
}

const groupService = new GroupService();
export default groupService;
