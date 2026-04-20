import { BadRequestError } from '@global/helpers/error-handlers';
import { Helpers } from '@global/helpers/helpers';
import type { IStudyPlan } from '@studyPlan/interfaces/plan.interface';
import type { ISection } from '@studyPlan/interfaces/section.interface';
import type { IUnit } from '@studyPlan/interfaces/unit.interface';
import StudyPlanModel from '@studyPlan/models/plan.schema';
import SectionModel from '@studyPlan/models/section.schema';
import UnitModel from '@studyPlan/models/unit.schema';

class StudyPlanService {
    private model = StudyPlanModel;

    private sectionModel = SectionModel;

    private unitModel = UnitModel;

    async createUnit(data: Partial<IUnit>): Promise<IUnit> {
        const unit = await this.unitModel.create(data);
        await this.sectionModel.findByIdAndUpdate(unit.section, {
            $push: { units: unit._id },
        });
        return unit;
    }

    async getUnitById(id: string): Promise<IUnit | null> {
        return await this.unitModel.findById(id);
    }

    async getAllUnits(): Promise<IUnit[]> {
        return await this.unitModel.find();
    }

    async getUnitsBySectionId(sectionId: string): Promise<IUnit[]> {
        return await this.unitModel.find({ section: sectionId });
    }

    async updateUnit(id: string, data: Partial<IUnit>): Promise<IUnit | null> {
        const unit = await this.unitModel.findById(id);
        if (!unit) {
            throw new BadRequestError('Unit not found');
        }
        return await this.unitModel.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteUnit(id: string): Promise<IUnit | null> {
        const unit = await this.unitModel.findById(id);
        if (!unit) {
            throw new BadRequestError('Unit not found');
        }
        await this.unitModel.findByIdAndDelete(id);
        await this.sectionModel.findByIdAndUpdate(unit.section, {
            $pull: { units: id },
        });
        return null;
    }

    /**
     * Study Plan Methods
     */

    async createPlan(data: IStudyPlan): Promise<IStudyPlan> {
        const slug = Helpers.slugify(data.title);
        return await this.model.create({ ...data, slug });
    }

    async getPlanById(id: string): Promise<IStudyPlan | null | ISection> {
        if (Helpers.isValidObjectId(id)) {
            return await this.model.findById(id).populate({
                path: 'sections',
                select: 'title slug description',
            });
        }

        const isPlanExists = await this.model.exists({ slug: id });
        if (isPlanExists) {
            return await this.model.findOne({ slug: id }).populate({
                path: 'sections',
                select: 'title slug description',
            });
        }

        return this.sectionModel.findOne({ slug: id }).populate([
            {
                path: 'studyPlan',
                select: 'title slug description',
            },
            {
                path: 'units',
                select: 'title slug description',
            },
        ]);
    }

    async getAllPlans(): Promise<IStudyPlan[]> {
        return await this.model.find().select('title slug tagline description');
    }

    async updatePlan(id: string, data: Partial<IStudyPlan>): Promise<IStudyPlan | null> {
        const plan = await this.model.findById(id);
        if (!plan) {
            throw new BadRequestError('Study Plan not found');
        }

        if (data.title) {
            data.slug = Helpers.slugify(data.title);
        }
        return await this.model.findByIdAndUpdate(id, data, { new: true });
    }

    async deletePlan(id: string): Promise<IStudyPlan | null> {
        const plan = await this.model.findById(id);
        if (!plan) {
            throw new BadRequestError('Study Plan not found');
        }
        await this.model.findByIdAndDelete(id);
        return null;
    }

    /**
     * Section Methods
     */

    async createSection(data: ISection): Promise<ISection> {
        const slug = Helpers.slugify(data.title);
        const section = await this.sectionModel.create({ ...data, slug });
        await this.model.findByIdAndUpdate(section.studyPlan, {
            $push: { sections: section._id },
        });
        return section;
    }

    async getSectionById(id: string): Promise<ISection | null> {
        if (Helpers.isValidObjectId(id)) {
            return await this.sectionModel
                .findById(id)
                .populate([{ path: 'units' }])
                .select('units');
        }
        return await this.sectionModel
            .findOne({ slug: id })
            .populate([{ path: 'units' }])
            .select('units');
    }

    async getAllSections(): Promise<ISection[]> {
        return await this.sectionModel.find();
    }

    async getSectionsByPlanId(planId: string): Promise<ISection[]> {
        let planExists;
        if (Helpers.isValidObjectId(planId)) {
            planExists = await this.model.exists({ _id: planId });
        } else {
            planExists = await this.model.exists({ slug: planId });
        }

        if (!planExists) {
            throw new BadRequestError('Study Plan not found');
        }

        return await this.sectionModel.find({ studyPlan: planExists._id }).populate('units');
    }

    async updateSection(id: string, data: Partial<ISection>): Promise<ISection | null> {
        const section = await this.sectionModel.findById(id);
        if (!section) {
            throw new BadRequestError('Section not found');
        }

        if (data.title) {
            data.slug = Helpers.slugify(data.title);
        }

        return await this.sectionModel.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteSection(id: string): Promise<ISection | null> {
        const section = await this.sectionModel.findById(id);
        if (!section) {
            throw new BadRequestError('Section not found');
        }
        await this.sectionModel.findByIdAndDelete(id);
        await this.model.updateMany({ sections: id }, { $pull: { sections: id } });
        return null;
    }
}

const studyPlanService = new StudyPlanService();

export default studyPlanService;
