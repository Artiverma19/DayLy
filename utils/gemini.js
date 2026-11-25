import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
    throw new Error('Gemini API key missing. Set GEMINI_API_KEY or GOOGLE_API_KEY in your environment.');
}

const ai = new GoogleGenAI({ apiKey });

// Prefer current fast models and fall back automatically on transient/capacity errors (e.g. 503).
const DEFAULT_MODELS = [
    'gemini-3.5-flash-lite',
    'gemini-4-hydrogen',
    'gemini-flash-lite-latest',
    'gemini-flash-latest',
];

function getCandidateModels() {
    const configured = process.env.GEMINI_MODEL?.trim();
    return [...new Set(configured ? [configured, ...DEFAULT_MODELS] : DEFAULT_MODELS)];
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generates text using Gemini with automatic fallback across candidate models
 * when a model is temporarily unavailable or experiences a transient network failure.
 */
export async function generateText(contents) {
    const models = getCandidateModels();
    let lastError = null;

    for (const model of models) {
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const response = await ai.models.generateContent({ model, contents });
                const text = response?.text?.trim() || '';
                if (text) {
                    return { text, model };
                }
                lastError = new Error(`Model ${model} returned an empty response.`);
                break;
            } catch (error) {
                lastError = error;
                const status = error?.status;
                console.warn(`Gemini model "${model}" attempt ${attempt + 1} failed (${status ?? 'unknown'}): ${error?.message || error}`);

                // Fail fast on auth/permission errors.
                if (status === 401 || status === 403) {
                    throw error;
                }

                // Retry once on transient network errors before falling back to the next model.
                const isNetworkError = status === undefined && /fetch failed/i.test(error?.message || '');
                if (isNetworkError && attempt === 0) {
                    await sleep(300);
                    continue;
                }
                break;
            }
        }
    }

    throw lastError || new Error('All Gemini models failed to generate a response.');
}
