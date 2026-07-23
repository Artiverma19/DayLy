import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import our new route files
import contentRoutes from './routes/content.js';
import trackerRoutes from './routes/tracker.js';

// Load secret variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// Setup paths to serve frontend files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Tell Express to serve the static frontend files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

// Connect the route files to specific URLs
app.use('/api/content', contentRoutes);
app.use('/api/tracker', trackerRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 DayLy server is running on http://localhost:${PORT}`);
});