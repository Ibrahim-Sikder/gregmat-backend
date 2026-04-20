import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '@root/config';

export interface FeedbackPoint {
    point: string;
    description: string;
}

export interface SectionFeedback {
    introduction: string[];
    bodyParagraph1: string[];
    bodyParagraph2: string[];
    conclusion: string[];
}

export interface FeedbackResult {
    score: number;
    wordCount: number;
    goodPoints: FeedbackPoint[];
    areasForImprovement: FeedbackPoint[];
    sectionFeedback: SectionFeedback;
    summaryAndRecommendations: string;
    suggestedScore: string;
    estimatedTime?: string;
}

export interface MainIdeaEvaluationResult {
    score: number;
    comment: string;
}

export interface VocabEvaluationResult {
    score: number;
    comment: string;
}

const logger = config.createLogger('GeminiService');

class GeminiService {
    private apiKey = config.GEMINI_API_KEY;

    private genAI: GoogleGenerativeAI | null = null;

    constructor() {
        if (this.apiKey) {
            try {
                this.genAI = new GoogleGenerativeAI(this.apiKey);
                logger.info('✅ GeminiService initialized with API key');
            } catch (error) {
                logger.error('❌ Failed to initialize GoogleGenerativeAI:', error);
                throw new Error('Failed to initialize Gemini API');
            }
        } else {
            logger.error('❌ GEMINI_API_KEY not found');
            throw new Error('GEMINI_API_KEY is required');
        }
    }

    async generateFeedback(essay: string, promptBody: string): Promise<FeedbackResult> {
        const words = this.wordCount(essay);
        logger.info(`📝 Generating feedback for essay with ${words} words`);

        if (!this.genAI) {
            throw new Error('Gemini API not initialized - missing API key');
        }

        if (words < 20) {
            throw new Error('Essay is too short (less than 20 words) - cannot generate feedback');
        }

        try {
            const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
            logger.info(`🤖 Calling Gemini API with model: ${modelName}`);

            const model = this.genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    temperature: 0.4,
                    maxOutputTokens: 5000,
                    topP: 0.95,
                    topK: 40,
                },
            });

            const prompt = this.buildPrompt(essay, promptBody, words);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            logger.info('📨 Received response from Gemini API');

            if (!text) {
                throw new Error('Empty response from Gemini API');
            }

            const feedback = this.parseGeminiFeedback(text, words);
            if (!feedback) {
                throw new Error('Failed to parse Gemini response into valid feedback structure');
            }

            logger.info('✅ Successfully parsed AI feedback');
            return feedback;
        } catch (error: any) {
            logger.error('❌ Gemini API Error:', {
                message: error?.message,
                status: error?.status,
                code: error?.code,
            });

            if (error?.message?.includes('API_KEY_INVALID')) {
                throw new Error(
                    'Invalid Gemini API key - please check your GEMINI_API_KEY configuration'
                );
            } else if (error?.message?.includes('quota')) {
                throw new Error('Gemini API quota exceeded - please try again later');
            } else if (error?.message?.includes('SAFETY')) {
                throw new Error('Content blocked by Gemini safety filters');
            } else if (error?.message?.includes('Failed to parse')) {
                throw error; // Re-throw parsing errors as-is
            }

            throw new Error(`Gemini API error: ${error?.message || 'Unknown error'}`);
        }
    }

    private buildPrompt(essay: string, promptBody: string, wordCount: number): string {
        return `You are an expert GRE/GMAT essay evaluator. Analyze this essay and provide detailed, specific feedback following a strict structure.

ESSAY PROMPT:
${promptBody}

STUDENT'S ESSAY (${wordCount} words):
${essay}

INSTRUCTIONS:
Evaluate this essay and return ONLY a valid JSON object with the following structure:

{
  "score": number, // e.g. 3.5
  "wordCount": ${wordCount},
  "goodPoints": [
    { "point": "Title", "description": "Description with specific examples from text" },
    { "point": "Title", "description": "..." },
    { "point": "Title", "description": "..." }
  ],
  "areasForImprovement": [
    { "point": "Title", "description": "Description with specific examples from text" },
    { "point": "Title", "description": "..." },
    { "point": "Title", "description": "..." }
  ],
  "sectionFeedback": {
    "introduction": ["Bullet point 1", "Bullet point 2"],
    "bodyParagraph1": ["Bullet point 1", "Bullet point 2"],
    "bodyParagraph2": ["Bullet point 1", "Bullet point 2"],
    "conclusion": ["Bullet point 1", "Bullet point 2"]
  },
  "summaryAndRecommendations": "A paragraph summarizing the essay and giving final recommendations.",
  "suggestedScore": "3.5 (The essay addresses...)"
}

IMPORTANT GUIDELINES:
1. **score**: Use 0.5 increments (e.g. 3.0, 3.5, 4.0).
2. **goodPoints**: Identify exactly 3 strengths.
3. **areasForImprovement**: Identify exactly 3 weaknesses (e.g. Grammar, Organization, Development).
4. **sectionFeedback**: Provide specific bullet points for each section. If the essay structure is unclear, do your best to map it.
5. **Be Specific**: Quote the essay when possible to support your points.
6. **Tone**: Professional and constructive.
7. Return ONLY the JSON object, no markdown formatting like \`\`\`json.
8. Ensure the JSON is well-formed (close all braces and brackets, strict comma usage).

JSON Response:`;
    }

    private parseGeminiFeedback(text: string, wordCount: number): FeedbackResult | null {
        try {
            // Remove markdown code blocks
            let cleanText = text
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');

            if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
                logger.error('No JSON object found in response (missing braces)');
                return null;
            }

            cleanText = cleanText.substring(firstBrace, lastBrace + 1);

            const parsed = JSON.parse(cleanText) as FeedbackResult;

            // Validate the parsed object
            if (!this.isValidFeedback(parsed)) {
                logger.error('Invalid feedback structure', { keys: Object.keys(parsed) });
                return null;
            }

            // Ensure wordCount and estimatedTime are set correctly
            parsed.wordCount = wordCount;
            parsed.estimatedTime = `${Math.max(1, Math.round(wordCount / 180))} min read`;

            return parsed;
        } catch (error) {
            logger.error('Failed to parse feedback JSON:', error);
            logger.error('Raw text sample:', text.substring(0, 1000)); // Log more text
            return null;
        }
    }

    private isValidFeedback(obj: any): obj is FeedbackResult {
        const isValid =
            obj &&
            typeof obj.score === 'number' &&
            Array.isArray(obj.goodPoints) &&
            obj.goodPoints.length === 3 &&
            Array.isArray(obj.areasForImprovement) &&
            obj.areasForImprovement.length === 3 &&
            obj.sectionFeedback &&
            Array.isArray(obj.sectionFeedback.introduction) &&
            Array.isArray(obj.sectionFeedback.bodyParagraph1) &&
            Array.isArray(obj.sectionFeedback.bodyParagraph2) &&
            Array.isArray(obj.sectionFeedback.conclusion) &&
            typeof obj.summaryAndRecommendations === 'string' &&
            typeof obj.suggestedScore === 'string';

        if (!isValid) {
            logger.error('Validation failed:', {
                hasScore: typeof obj?.score === 'number',
                hasGoodPoints: Array.isArray(obj?.goodPoints),
                goodPointsLen: obj?.goodPoints?.length,
                hasAreas: Array.isArray(obj?.areasForImprovement),
                areasLen: obj?.areasForImprovement?.length,
                hasSectionFeedback: !!obj?.sectionFeedback,
                hasSummary: typeof obj?.summaryAndRecommendations === 'string',
                hasSuggestedScore: typeof obj?.suggestedScore === 'string',
            });
        }

        return isValid;
    }

    private wordCount(text: string): number {
        if (!text) return 0;
        return text.trim().split(/\s+/).filter(Boolean).length;
    }

    async evaluateMainIdea(
        givenMainIdea: string,
        correctMainIdea: string,
        paragraphBody: string
    ): Promise<MainIdeaEvaluationResult> {
        logger.info('🔍 Evaluating main idea submission');

        if (!this.genAI) {
            throw new Error('Gemini API not initialized - missing API key');
        }

        if (!givenMainIdea || givenMainIdea.trim().length < 5) {
            return {
                score: 1,
                comment:
                    'The submitted main idea is too short or empty. Please provide a substantive answer that captures the central point of the passage.',
            };
        }

        try {
            const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
            logger.info(`🤖 Calling Gemini API with model: ${modelName}`);

            const model = this.genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 500,
                    topP: 0.95,
                    topK: 40,
                },
            });

            const prompt = this.buildMainIdeaPrompt(givenMainIdea, correctMainIdea, paragraphBody);

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            logger.info('📨 Received main idea evaluation from Gemini API');

            if (!text) {
                throw new Error('Empty response from Gemini API');
            }

            const evaluation = this.parseMainIdeaEvaluation(text);
            if (!evaluation) {
                throw new Error('Failed to parse Gemini main idea evaluation response');
            }

            logger.info('✅ Successfully evaluated main idea');
            return evaluation;
        } catch (error: any) {
            logger.error('❌ Gemini API Error during main idea evaluation:', {
                message: error?.message,
                status: error?.status,
                code: error?.code,
            });

            if (error?.message?.includes('API_KEY_INVALID')) {
                throw new Error(
                    'Invalid Gemini API key - please check your GEMINI_API_KEY configuration'
                );
            } else if (error?.message?.includes('quota')) {
                throw new Error('Gemini API quota exceeded - please try again later');
            } else if (error?.message?.includes('SAFETY')) {
                throw new Error('Content blocked by Gemini safety filters');
            } else if (error?.message?.includes('Failed to parse')) {
                throw error;
            }

            throw new Error(`Gemini API error: ${error?.message || 'Unknown error'}`);
        }
    }

    private buildMainIdeaPrompt(
        givenMainIdea: string,
        correctMainIdea: string,
        paragraphBody: string
    ): string {
        return `You are an expert GRE/GMAT reading comprehension evaluator. Evaluate how well the student's main idea captures the central point of the passage.

PASSAGE:
${paragraphBody}

CORRECT MAIN IDEA:
${correctMainIdea}

STUDENT'S MAIN IDEA:
${givenMainIdea}

INSTRUCTIONS:
Evaluate the student's main idea and return ONLY a valid JSON object with these exact fields:

1. **score** (number 1-5):
   - 1: Completely misses the main idea or is irrelevant/nonsensical
   - 2: Identifies a minor detail or tangential point, not the central idea
   - 3: Captures part of the main idea but misses key elements or lacks precision
   - 4: Good understanding, captures most of the main idea with minor gaps
   - 5: Excellent - accurately and concisely captures the central point

2. **comment** (string): 
   - 2-4 sentences explaining the score
   - Reference what the student got right or wrong
   - Be specific about what's missing or inaccurate
   - If score is 3 or below, explain what the main idea should include
   - Keep it constructive and educational

IMPORTANT:
- Focus on whether the student identified the CENTRAL POINT, not supporting details
- A main idea should be concise yet comprehensive
- The student doesn't need to match the exact wording, but should capture the same meaning
- Return ONLY the JSON object, no markdown, no explanations, no preamble

JSON Response:`;
    }

    private parseMainIdeaEvaluation(text: string): MainIdeaEvaluationResult | null {
        try {
            const cleanText = text
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.error('No JSON object found in main idea evaluation response');
                return null;
            }

            const parsed = JSON.parse(jsonMatch[0]) as MainIdeaEvaluationResult;

            if (!this.isValidMainIdeaEvaluation(parsed)) {
                logger.error('Invalid main idea evaluation structure:', parsed);
                return null;
            }

            return parsed;
        } catch (error) {
            logger.error('Failed to parse main idea evaluation JSON:', error);
            logger.error('Raw text:', text.substring(0, 500));
            return null;
        }
    }

    private isValidMainIdeaEvaluation(obj: any): obj is MainIdeaEvaluationResult {
        const isValid =
            obj &&
            typeof obj.score === 'number' &&
            obj.score >= 1 &&
            obj.score <= 5 &&
            typeof obj.comment === 'string' &&
            obj.comment.length > 10;

        if (!isValid) {
            logger.error('Main idea evaluation validation failed:', {
                hasScore: typeof obj?.score === 'number',
                scoreInRange: obj?.score >= 1 && obj?.score <= 5,
                hasComment: typeof obj?.comment === 'string',
                commentLength: obj?.comment?.length,
            });
        }

        return isValid;
    }

    async evaluateVocabDefinition(
        word: string,
        correctDefinition: string,
        givenDefinition: string
    ): Promise<VocabEvaluationResult> {
        logger.info(`🔍 Evaluating vocab definition for word: ${word}`);

        if (!this.genAI) {
            throw new Error('Gemini API not initialized - missing API key');
        }

        if (!givenDefinition || givenDefinition.trim().length < 2) {
            return {
                score: 0,
                comment:
                    'Submission is unclear and does not demonstrate understanding of the word.',
            };
        }

        try {
            const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
            const model = this.genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    temperature: 0.2, // Lower temperature for more objective grading
                    maxOutputTokens: 200,
                    topP: 0.95,
                    topK: 40,
                },
            });

            const prompt = `You are an expert GRE/GMAT/TOEFL vocabulary evaluator. Evaluate if the student's definition for the word "${word}" is accurate.

WORD: ${word}
CORRECT DEFINITION: ${correctDefinition}
STUDENT'S DEFINITION: ${givenDefinition}

INSTRUCTIONS:
Evaluate the student's definition and return ONLY a valid JSON object with these exact fields:

1. **score** (number 0-1):
   - 0: Completely incorrect, irrelevant, or nonsense.
   - 0.5: Partially correct but misses core meaning or uses word in wrong context.
   - 1: Correct and captures the essence of the word's meaning.

2. **comment** (string):
   - A brief (1-2 sentences) explanation of why this score was given.
   - Be constructive.

IMPORTANT:
- Focus on the essence of the meaning, not perfect wording.
- Return ONLY the JSON object, no markdown, no explanations.

JSON Response:`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            if (!text) {
                throw new Error('Empty response from Gemini API');
            }

            const evaluation = this.parseVocabEvaluation(text);
            return evaluation || { score: 0, comment: 'Failed to evaluate definition.' };
        } catch (error: any) {
            logger.error('❌ Gemini API Error during vocab evaluation:', error);
            return { score: 0, comment: 'Evaluation error occurred.' };
        }
    }

    private parseVocabEvaluation(text: string): VocabEvaluationResult | null {
        try {
            const cleanText = text
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) return null;
            return JSON.parse(jsonMatch[0]) as VocabEvaluationResult;
        } catch (error) {
            return null;
        }
    }
}

const geminiService = new GeminiService();
export default geminiService;
