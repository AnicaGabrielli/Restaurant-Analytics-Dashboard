import express from 'express';
import cors from 'cors';
import routes from './routes/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// API Routes
app.use('/api', routes);

// Serve frontend pages
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

export default app;