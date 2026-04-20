import type { ObjectId } from 'mongodb';
import type { Document } from 'mongoose';

export interface IChoice {
    order: number;
    title: string;
    body: string;
}

export interface IChoiceGroup {
    title: string;
    choices: IChoice[];
}

export interface ILeftSideText {
    title: string;
    body: string;
}

export enum QuestionType {
    QuantitativeComparison = 'quantitative_comparison',
    MultipleChoice = 'multiple_choice',
    MultipleSelect = 'multiple_select',
    NumericEntryFraction = 'numeric_entry_fraction',
    NumericEntryNotFraction = 'numeric_entry_not_fraction',
    TC1Blank = 'tc_1_blank',
    TC2Blank = 'tc_2_blank',
    TC3Blank = 'tc_3_blank',
    ReadingMultipleChoice = 'reading_multiple_choice',
    ReadingSelectAll = 'reading_select_all',
    SentenceEquivalence = 'sentence_equivalence',
    Matching = 'matching',
    FillInTheBlank = 'fill_in_the_blank',
    Pairing = 'pairing',
}

export enum ISuperCategory {
    Quant = 'Quant',
    Verbal = 'Verbal',
    Vocab = 'Vocab',
}

export enum IStatus {
    Solved = 'solved',
    ToDo = 'to_do',
    Attempted = 'attempted',
}

export enum IDifficulty {
    Easy = 'easy',
    Medium = 'medium',
    Hard = 'hard',
}

export interface IQuestion extends Document {
    title: string;
    short_meta: string;
    type: QuestionType;
    body: string;
    choice_groups: IChoiceGroup[];
    slug: string;
    has_solution_video: boolean;
    note: string;
    can_watch: boolean;
    solution_video?: string;
    answer?: string;
    max_score: number;
    source?: string;
    super_category: ISuperCategory;
    solution_has_video: boolean;
    left_side_text?: ILeftSideText;
    order_in_quiz: number;
    quiz?: ObjectId;
    difficulty?: IDifficulty;
    status?: IStatus;
    bookmarked?: boolean;
    liked?: boolean;
    disliked?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
