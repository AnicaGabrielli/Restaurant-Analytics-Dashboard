import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

import config from './config/env.js';
import database from './config/database.js';
import logger from './utils/logger.js';
import errorHandler from './utils/errorHandler.js';
import { notFoundHandler } from './utils/errorHandler.js';
import middlewares from './middlewares/index.js';
import apiRoutes from './routes/api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ===== CONFIGURAÇÃO DE HANDLERS GLOBAIS =====
errorHandler.setupGlobalHandlers();

// ===== MIDDLEWARES GLOBAIS =====
app.use(middlewares.httpLogger);
app.use(middlewares.securityHeaders);
app.use(middlewares.corsMiddleware);
app.use(middlewares.compressionMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(middlewares.sanitizeInputs);
app.use(middlewares.responseHeaders);
app.use(middlewares.requestTimeout(30000));

// ===== ASSETS ESTÁTICOS =====
app.use(express.static(path.join(__dirname, '../frontend'), {
    maxAge: config.server.isProduction ? '1d' : 0
}));

// ===== ROTAS API =====
app.use('/api', apiRoutes);

// ===== FRONTEND SPA =====
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ===== ERROR HANDLERS =====
app.use(notFoundHandler);
app.use(errorHandler.expressErrorHandler());

// ===== INICIALIZAÇÃO =====
async function startServer() {
    try {
        // Conecta ao banco
        await database.connect();
        
        // Inicia servidor
        app.listen(config.server.port, () => {
            logger.info('='.repeat(60));
            logger.info('🍔 Restaurant Analytics Dashboard');
            logger.info('='.repeat(60));
            logger.info(`✅ Servidor rodando em http://localhost:${config.server.port}`);
            logger.info(`✅ Ambiente: ${config.server.env}`);
            logger.info(`✅ Database: ${config.database.database}@${config.database.host}`);
            logger.info(`✅ Cache: ${config.cache.enabled ? 'Ativado' : 'Desativado'}`);
            logger.info('='.repeat(60));
        });
    } catch (error) {
        logger.error('❌ Erro fatal ao iniciar servidor', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    logger.info('SIGTERM recebido. Encerrando gracefully...');
    await database.close();
    process.exit(0);
});

startServer();