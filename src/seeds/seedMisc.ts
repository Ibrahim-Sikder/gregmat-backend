import { MiscQuizModel } from '@misc/models/misc.models';
import { miscSeed } from './data/mics';

export const seedMisc = async () => {
    try {
        // Clear existing data
        await MiscQuizModel.deleteMany({});

        // Insert new data
        await MiscQuizModel.insertMany(miscSeed);

        console.log('Misc quiz data seeded successfully');
    } catch (error) {
        console.error('Error seeding misc quiz data:', error);
    }
};
