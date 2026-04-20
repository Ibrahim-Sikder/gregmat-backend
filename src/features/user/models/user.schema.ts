import { UserRole, type IUserDocument } from '@user/interfaces/user.interface';
import type { Model } from 'mongoose';
import { model, Schema } from 'mongoose';

const userSchema: Schema = new Schema<IUserDocument>(
    {
        auth: { type: Schema.Types.ObjectId, ref: 'Auth' },
        uId: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        username: { type: String, required: true },
        profilePicture: { type: String },
        role: { type: String, enum: UserRole, default: UserRole.USER },
        isEmailVerified: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const UserModel: Model<IUserDocument> = model<IUserDocument>('User', userSchema, 'User');
export default UserModel;
