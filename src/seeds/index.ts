import setupDatabase from '@root/setupDatabase';
import { seedMisc } from './seedMisc';

(async () => {
    setupDatabase();

    // await seedAdmin();
    await seedMisc();

    process.exit(0);
})();
