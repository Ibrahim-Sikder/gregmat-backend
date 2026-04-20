import type {
    IQuizCollection,
    IQuizGroup,
    IQuizReference,
} from '@quiz/interfaces/collection.interface';
import { model, Schema } from 'mongoose';

const QuizReferenceSchema = new Schema<IQuizReference>(
    {
        quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
        order_in_group: { type: Number, required: true, min: 0, default: 0 },
    },
    { _id: false }
);

const QuizGroupSchema = new Schema<IQuizGroup>(
    {
        title: { type: String, required: true },
        img: { type: String, default: null },
        slug: { type: String, required: true },
        body: { type: String, required: false },
        quizzes: { type: [QuizReferenceSchema], default: [] },
        access: { type: String, required: false },
        website: { type: String, required: false },
    },
    { _id: false }
);

const QuizCollectionSchema = new Schema<IQuizCollection>(
    {
        title: { type: String, required: true },
        tagline: { type: String, required: false },
        slug: { type: String, required: true, unique: true },
        img: { type: String, default: null },
        body: { type: String, required: true },
        quiz_groups: { type: [QuizGroupSchema], default: [] },
        website: { type: String, required: false },
    },
    { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

const QuizCollectionModel = model<IQuizCollection>(
    'QuizCollection',
    QuizCollectionSchema,
    'QuizCollection'
);

export default QuizCollectionModel;
