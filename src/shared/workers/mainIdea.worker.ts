import { config } from '@root/config';
import geminiService from '@service/ai/gemini.service';
import MainIdeaAttemptModel from '@practice/models/mainIdeaAttempt.schema';
import ParagraphModel from '@practice/models/paragraph.schema';
import type { DoneCallback, Job } from 'bull';
import type Logger from 'bunyan';

const log: Logger = config.createLogger('mainIdeaWorker');

interface IMainIdeaJobData {
    attemptId: string;
    paragraphAttempts: Array<{
        paragraph: string;
        given_main_idea: string;
    }>;
}

class MainIdeaWorker {
    async gradeMainIdeaAttempt(job: Job, done: DoneCallback): Promise<void> {
        try {
            const { attemptId, paragraphAttempts } = job.data as IMainIdeaJobData;

            log.info(`Starting to grade attempt: ${attemptId}`);

            // Fetch the attempt
            const attempt = await MainIdeaAttemptModel.findById(attemptId);
            if (!attempt) {
                throw new Error(`Attempt not found: ${attemptId}`);
            }

            // Get all paragraphs
            const paragraphIds = paragraphAttempts.map((pa) => pa.paragraph);
            const paragraphs = await ParagraphModel.find({
                _id: { $in: paragraphIds },
            });

            if (paragraphs.length !== paragraphAttempts.length) {
                throw new Error('Some paragraphs not found');
            }

            const totalAttempts = paragraphAttempts.length;
            let completedAttempts = 0;

            // Grade each paragraph attempt
            for (let i = 0; i < paragraphAttempts.length; i++) {
                const paragraphAttempt = paragraphAttempts[i];
                const paragraph = paragraphs.find(
                    (p) => p._id.toString() === paragraphAttempt.paragraph
                );

                if (!paragraph) {
                    throw new Error(`Paragraph not found: ${paragraphAttempt.paragraph}`);
                }

                try {
                    log.info(
                        `Grading paragraph ${i + 1}/${totalAttempts} for attempt ${attemptId}`
                    );

                    const evaluation = await geminiService.evaluateMainIdea(
                        paragraphAttempt.given_main_idea,
                        paragraph.main_idea,
                        paragraph.body
                    );

                    // Update the specific paragraph attempt in the array
                    attempt.paragraph_attempts[i].gpt_score = evaluation.score;
                    attempt.paragraph_attempts[i].gpt_comment = evaluation.comment;

                    completedAttempts++;
                    const progress = Math.round((completedAttempts / totalAttempts) * 100);
                    job.progress(progress);

                    log.info(
                        `Graded paragraph ${i + 1}/${totalAttempts}: Score ${evaluation.score}/5`
                    );
                } catch (error: any) {
                    log.error(`Error grading paragraph ${i + 1}: ${error.message}`);
                    // Set default values on error
                    attempt.paragraph_attempts[i].gpt_score = 3;
                    attempt.paragraph_attempts[i].gpt_comment =
                        'Unable to automatically grade this response. Please review manually.';
                }
            }

            // Calculate total score
            const totalScore = attempt.paragraph_attempts.reduce(
                (sum, pa) => sum + (pa?.gpt_score ?? 0),
                0
            );

            // Update attempt with final results
            attempt.graded = true;
            attempt.score = totalScore;
            await attempt.save();

            log.info(
                `✅ Completed grading attempt ${attemptId}: Total score ${totalScore}/${totalAttempts * 5}`
            );

            job.progress(100);
            done(null, { attemptId, totalScore, graded: true });
        } catch (error: any) {
            log.error(`❌ Error grading attempt: ${error.message}`, error);
            done(error as Error);
        }
    }
}

const mainIdeaWorker = new MainIdeaWorker();

export default mainIdeaWorker;
