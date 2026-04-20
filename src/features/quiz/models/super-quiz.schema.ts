import type { SuperQuiz } from '@quiz/interfaces/super-quiz.interface';
import { model, Schema } from 'mongoose';

const SuperQuizSchema = new Schema<SuperQuiz>(
    {
        title: { type: String, required: true },
        description: { type: String },
        questions: [{ type: Schema.Types.ObjectId, ref: 'Question', required: true }],
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        attempts: [{ type: Schema.Types.ObjectId, ref: 'Attempt' }],
    },
    { timestamps: true }
);

const SuperQuizModel = model<SuperQuiz>('SuperQuiz', SuperQuizSchema, 'SuperQuiz');

export default SuperQuizModel;
