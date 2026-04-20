import type { DoneCallback, Job } from 'bull';
import fs from 'fs';
import path from 'path';
import { config } from '@root/config';
import type Logger from 'bunyan';

const log: Logger = config.createLogger('chunkWorker');

class ChunkWorkers {
    public async cleanupChunks(job: Job, done: DoneCallback): Promise<void> {
        try {
            log.info('Starting chunk cleanup job...');

            const chunksDir = path.join(process.cwd(), 'uploads', 'chunks');

            if (!fs.existsSync(chunksDir)) {
                log.info('Chunks directory does not exist, skipping cleanup');
                return done(null, job.data);
            }

            const chunkFolders = fs.readdirSync(chunksDir);
            let deletedCount = 0;
            let errorCount = 0;

            const currentTime = Date.now();
            const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

            for (const folder of chunkFolders) {
                // Skip if it's not a directory or is the temp folder
                const folderPath = path.join(chunksDir, folder);

                try {
                    const stats = fs.statSync(folderPath);

                    if (!stats.isDirectory()) {
                        continue;
                    }

                    // Skip the temp folder - it has its own cleanup logic
                    if (folder === 'temp') {
                        continue;
                    }

                    let shouldDelete = false;
                    let ageInHours = 0;

                    // First check if there's metadata with lastUpdated
                    const metadataPath = path.join(folderPath, 'metadata.json');
                    if (fs.existsSync(metadataPath)) {
                        try {
                            const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
                            const metadata = JSON.parse(metadataContent);

                            if (metadata.lastUpdated) {
                                const lastUpdatedTime = new Date(metadata.lastUpdated).getTime();
                                const age = currentTime - lastUpdatedTime;
                                ageInHours = age / (60 * 60 * 1000);

                                if (age > TWENTY_FOUR_HOURS) {
                                    shouldDelete = true;
                                    log.info(
                                        `Marking folder for deletion (metadata age: ${ageInHours.toFixed(1)}h): ${folder}`
                                    );
                                }
                            } else {
                                // Metadata exists but no lastUpdated, use creation time
                                const age = currentTime - stats.birthtimeMs;
                                ageInHours = age / (60 * 60 * 1000);
                                if (age > TWENTY_FOUR_HOURS) {
                                    shouldDelete = true;
                                    log.info(
                                        `Marking folder for deletion (creation age: ${ageInHours.toFixed(1)}h): ${folder}`
                                    );
                                }
                            }
                        } catch (parseError) {
                            log.error(`Error parsing metadata for ${folder}:`, parseError);
                            // Fall back to creation time
                            const age = currentTime - stats.birthtimeMs;
                            ageInHours = age / (60 * 60 * 1000);
                            if (age > TWENTY_FOUR_HOURS) {
                                shouldDelete = true;
                            }
                        }
                    } else {
                        // No metadata, use folder creation time (birthtime)
                        const age = currentTime - stats.birthtimeMs;
                        ageInHours = age / (60 * 60 * 1000);

                        if (age > TWENTY_FOUR_HOURS) {
                            shouldDelete = true;
                            log.info(
                                `Marking folder for deletion (no metadata, creation age: ${ageInHours.toFixed(1)}h): ${folder}`
                            );
                        }
                    }

                    if (shouldDelete) {
                        fs.rmSync(folderPath, { recursive: true, force: true });
                        deletedCount++;
                        log.info(
                            `Successfully deleted old chunk folder: ${folder} (age: ${ageInHours.toFixed(1)}h)`
                        );
                    }
                } catch (error) {
                    errorCount++;
                    log.error(`Error processing chunk folder ${folder}:`, error);
                }
            }

            log.info(`Chunk cleanup completed. Deleted: ${deletedCount}, Errors: ${errorCount}`);
            done(null, { deletedCount, errorCount, timestamp: new Date() });
        } catch (error) {
            log.error('Error in chunk cleanup job:', error);
            done(error as Error);
        }
    }
}

const chunkWorkers = new ChunkWorkers();
export default chunkWorkers;
