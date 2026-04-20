import type { IUnit } from '@studyPlan/interfaces/unit.interface';
import { model, Schema } from 'mongoose';

const UnitSchema = new Schema<IUnit>(
    {
        title: { type: String, required: true },
        description: String,
        order: Number,
        plusOnly: { type: Boolean, default: false },
        twoSided: { type: Boolean, default: false },
        leftSideTitle: String,
        leftSide: String,
        rightSideTitle: String,
        rightSide: String,
        section: { type: Schema.Types.ObjectId, ref: 'Section', required: true },
    },
    {
        timestamps: true,
    }
);

const UnitModel = model<IUnit>('Unit', UnitSchema, 'Unit');

export default UnitModel;
