import AuthModel from '@auth/models/auth.schema';
import { config } from '@root/config';
import UserModel from '@user/models/user.schema';
import type Logger from 'bunyan';
import { adminSeed } from './data/admin';

const log: Logger = config.createLogger('seedAdmin');

export const seedAdmin = async (): Promise<void> => {
    log.info('🌱 Seeding admin user...');

    // Check if admin already exists
    const existingAuth = await AuthModel.findOne({ email: adminSeed.email });
    if (existingAuth) {
        log.warn('⚠️ Admin user already exists');
        return;
    }

    const authDoc = await AuthModel.create({
        uId: adminSeed.uId,
        email: adminSeed.email,
        username: adminSeed.username,
        password: adminSeed.password,
        provider: 'credentials',
        role: adminSeed.role,
        isEmailVerified: adminSeed.isEmailVerified,
    });

    await UserModel.create({
        auth: authDoc._id,
        uId: adminSeed.uId,
        email: adminSeed.email,
        username: adminSeed.username,
        role: adminSeed.role,
        isEmailVerified: adminSeed.isEmailVerified,
    });

    log.info('✅ Admin seeded successfully');
};
