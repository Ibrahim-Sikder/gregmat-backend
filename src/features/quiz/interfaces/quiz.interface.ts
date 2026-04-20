import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export interface IRule {
    left: string;
    right: string;
    operator: 'gte' | 'lte' | 'gt' | 'lt' | 'eq' | 'ne';
}

export interface IRuleSet {
    rules: IRule[];
}

export interface ISection {
    identifier: number;
    title: string;
    section_type: 'Quant' | 'Verbal';
    start_index: number;
    end_index: number;
    minutes: number;
    rule: IRuleSet;
    description: string;
    attempts: ObjectId[];
}

export interface IScalingScore {
    [key: number]: number;
}

export interface IScalingFormula {
    quant: { [section: number]: IScalingScore };
    verbal: { [section: number]: IScalingScore };
}

export interface IQuiz extends Document {
    created_at: Date;
    plus_only: boolean;
    img?: string;
    title: string;
    body: string;
    completion_body?: string;
    slug: string;
    minutes: number;
    questions: ObjectId[];
    super_category: 'Quant' | 'Verbal';
    attempts: ObjectId[]; // Reference to IAttempt
    timing_mode: 'Time Sensitive' | 'Untimed';
    emotions: string[];
    is_shown_in_quizdata: boolean;
    is_multisection: boolean;
    visible_sections: number;
    scale_to_gre: boolean;
    scaling_formula: IScalingFormula;
    begins_with_writing: boolean;
    writing_prompt?: string;
    sections: ISection[];
    break_minutes: number;
    experimental: boolean;
    is_prepswift: boolean;
    associated_class?: string;
    associated_content?: string;
    solution?: string;
}
