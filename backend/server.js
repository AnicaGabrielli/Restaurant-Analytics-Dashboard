// ========== backend/server.js ==========
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.js';
import database from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../frontend')));

// API routes
app.use('/api', apiRoutes);

// Serve frontend for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
    });
});

// Start server
async function startServer() {
    try {
        // Test database connection
        await database.connect();
        console.log('✓ Conexão com MySQL estabelecida');

        app.listen(PORT, () => {
            console.log('='.repeat(60));
            console.log('🍔 Restaurant Analytics Dashboard');
            console.log('='.repeat(60));
            console.log(`✓ Servidor rodando em http://localhost:${PORT}`);
            console.log(`✓ API disponível em http://localhost:${PORT}/api`);
            console.log('='.repeat(60));
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Encerrando servidor...');
    await database.close();
    process.exit(0);
});

startServer();