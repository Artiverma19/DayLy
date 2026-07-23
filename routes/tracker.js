import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!apiKey) {
    throw new Error('Gemini API key missing. Set GEMINI_API_KEY or GOOGLE_API_KEY in your environment.');
}

const router = express.Router();
const ai = new GoogleGenAI({ apiKey });

let tasks = [
    { 
        id: 1, 
        text: 'Finish AWS deployment setup', 
        status: 'in-progress', 
        date: '2026-07-25', 
        time: '14:00', 
        energy: 'high', 
        subtasks: ['Review Dockerfile', 'Push to AWS EC2'] 
    }
];

// Get all tasks
router.get('/list', (req, res) => {
    res.json(tasks);
});

// Add a new task with advanced fields
router.post('/add', (req, res) => {
    const { text, status, date, time, energy } = req.body;
    if (!text) return res.status(400).json({ error: 'Task text required' });

    const newTask = {
        id: Date.now(),
        text,
        status: status || 'not-started',
        date: date || '',
        time: time || '',
        energy: energy || 'medium',
        subtasks: []
    };
    tasks.push(newTask);
    res.json(newTask);
});

// Delete a task
router.delete('/delete/:id', (req, res) => {
    const id = Number(req.params.id);
    tasks = tasks.filter(t => t.id !== id);
    res.json({ success: true });
});

// Update task status
router.patch('/status/:id', (req, res) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.status = status;
        res.json(task);
    } else {
        res.status(404).json({ error: 'Task not found' });
    }
});

// AI Task Decomposition (Breakdown into subtasks)
router.post('/breakdown/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const task = tasks.find(t => t.id === id);
        if (!task) return res.status(404).json({ error: 'Task not found' });

        const prompt = `Break down this student task into 3 clear, actionable subtasks. Return ONLY a valid JSON array of strings, with no markdown formatting or extra text. Task: "${task.text}"`;

        const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
        const response = await ai.models.generateContent({
            model,
            contents: prompt
        });

        let textResponse = response.text.trim();
        textResponse = textResponse.replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
        const subtasks = JSON.parse(textResponse);

        task.subtasks = subtasks;
        res.json({ success: true, subtasks });
    } catch (error) {
        console.error('AI Breakdown Error:', error);
        res.status(500).json({ error: 'Failed to break down task' });
    }
});

export default router;