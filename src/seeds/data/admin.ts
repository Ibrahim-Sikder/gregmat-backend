import { Helpers } from '@global/helpers/helpers';

export const adminSeed = {
    uId: `${Helpers.generateRandomIntegers(12)}`,
    email: 'admin@example.com',
    username: 'admin',
    password: 'Admin@123',
    role: 'admin',
    isEmailVerified: true,
};
