import AuthModel from '@auth/models/auth.schema';
import { Pagination, Query, Search, Sort } from '@global/decorators/query.decorators';
import withTransaction from '@global/helpers/withTransaction';
import type { IUserDocument } from '@user/interfaces/user.interface';
import UserModel from '@user/models/user.schema';

class UserService {
    private model = UserModel;

    private authModel = AuthModel;

    public async createUser(data: IUserDocument): Promise<void> {
        await this.model.create(data);
    }

    public async deleteUserById(id: string): Promise<void> {
        withTransaction(async (session) => {
            const user = await this.model.findById(id).session(session).exec();
            if (user) {
                await this.authModel.deleteOne({ _id: user.auth }).session(session).exec();
                await this.model.deleteOne({ _id: id }).session(session).exec();
            }
        });
    }

    public async getUserById(id: string): Promise<IUserDocument | null> {
        return await this.model.findById(id).exec();
    }

    public async getUserByAuthId(authId: string): Promise<IUserDocument | null> {
        return await this.model.findOne({ auth: authId }).exec();
    }

    public async updateUser(id: string, data: Partial<IUserDocument>): Promise<void> {
        await this.model.updateOne({ _id: id }, { $set: data }).exec();
    }

    @Query()
    @Search(['username', 'email', 'uId'])
    @Pagination()
    @Sort('-createdAt')
    public async getAllUsers(query: Record<string, any>): Promise<any> {
        return await this.model.find(query).exec();
    }
}

const userService = new UserService();

export default userService;
