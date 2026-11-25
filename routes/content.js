import express from 'express';
import { generateText } from '../utils/gemini.js';

const router = express.Router();

// ROUTE: Generate social media & message content
router.post('/generate', async (req, res) => {
    try {
        const { platform, topic, includeHashtags, count } = req.body;
        if (!topic || !String(topic).trim()) {
            return res.status(400).json({ error: 'Topic is required.' });
        }

        let prompt = `You are an expert content creator for students. Generate content about: "${topic}".\n\n`;

        if (platform === 'linkedin') {
            prompt += `Format: Professional, structured LinkedIn post with clear spacing and key takeaways.`;
        } else if (platform === 'twitter') {
            prompt += `Format: Concise, punchy X/Twitter post strictly within 280 characters.`;
        } else if (platform === 'instagram') {
            prompt += `Format: Engaging Instagram caption with relevant emojis and line breaks.`;
        } else if (platform === 'email') {
            prompt += `Format: Professional, polite email draft with a Subject Line and Body.`;
        }

        if (includeHashtags) {
            prompt += ` Include relevant hashtags at the end.`;
        } else {
            prompt += ` Do NOT include any hashtags.`;
        }

        if (count && count > 1) {
            prompt += ` Provide ${count} distinct options labeled Option 1, Option 2, etc.`;
        }

        console.log('Content generate request', { platform, topic, includeHashtags, count });

        const { text, model } = await generateText(prompt);
        console.log('Content generated successfully with model:', model);

        res.json({ text });

    } catch (error) {
        console.error('Gemini API Error:', error?.message || error);
        console.error(error?.stack || 'No stack available');
        let errorBody = null;
        if (error?.response && typeof error.response.text === 'function') {
            try {
                errorBody = await error.response.text();
                console.error('Gemini API error body:', errorBody);
            } catch (logError) {
                console.error('Failed to read Gemini error response body:', logError);
            }
        }
        res.status(500).json({
            error: error?.message || 'Failed to generate content.',
            details: errorBody || undefined,
        });
    }
});

export default router;