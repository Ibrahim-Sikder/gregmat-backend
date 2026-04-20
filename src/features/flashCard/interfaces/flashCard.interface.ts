export interface IFlashCardClass {
    title: string;
    slug: string;
    remarks_for_upcoming_page?: string | null;
    description: string;
    session_number: number;
    img: string;
    class_type: string;
    plus_only: boolean;
    thumbnail_size: number;
}

export interface IFlashCardClassGroup {
    title: string;
    slug: string;
    description: string;
    order: number;
    img?: string | null;
    classes: IFlashCardClass[];
}

export interface IFlashCardCourse {
    title: string;
    order: number;
    ongoing: boolean;
    thumbnail_size: number;
    slug: string;
    description: string;
    img?: string | null;
    banner?: string | null;
    classgroups?: IFlashCardClassGroup[];
}

export interface IFlashCardCourseGroup {
    title: string;
    order: number;
    slug: string;
    description: string;
    img?: string | null;
    courses: IFlashCardCourse[];
}
