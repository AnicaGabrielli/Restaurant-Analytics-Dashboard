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

// Serve HTML pages - CORRIGIDO: Serve páginas específicas
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

app.get('/vendas.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/vendas.html'));
});

app.get('/produtos.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/produtos.html'));
});

app.get('/clientes.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/clientes.html'));
});

app.get('/performance.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/performance.html'));
});

app.get('/insights.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/insights.html'));
});

export default app;