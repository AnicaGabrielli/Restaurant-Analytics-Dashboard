// ========== backend/config/env.js ==========
// Validação e carregamento seguro de variáveis de ambiente

import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Schema de validação com Joi
const envSchema = Joi.object({
    // Database
    DB_HOST: Joi.string().required(),
    DB_USER: Joi.string().required(),
    DB_PASSWORD: Joi.string().allow('').required(),
    DB_NAME: Joi.string().required(),
    DB_PORT: Joi.number().default(3306),
    DB_CONNECTION_LIMIT: Joi.number().default(10),
    DB_QUEUE_LIMIT: Joi.number().default(0),
    DB_WAIT_FOR_CONNECTIONS: Joi.boolean().default(true),
    
    // Server
    PORT: Joi.number().default(3000),
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    
    // Security
    ALLOWED_ORIGINS: Joi.string().default('*'),
    RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
    RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
    
    // Cache
    CACHE_ENABLED: Joi.boolean().default(true),
    CACHE_TTL_DASHBOARD: Joi.number().default(300),
    CACHE_TTL_ANALYTICS: Joi.number().default(180),
    CACHE_TTL_SEARCH: Joi.number().default(60),
    
    // Logging
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
    LOG_FILE_ENABLED: Joi.boolean().default(true),
    LOG_FILE_PATH: Joi.string().default('logs/app.log'),
    
    // Export
    EXPORT_MAX_RECORDS: Joi.number().default(10000),
    
    // Feature Flags
    ENABLE_CACHE: Joi.boolean().default(true),
    ENABLE_COMPRESSION: Joi.boolean().default(true),
    ENABLE_HELMET: Joi.boolean().default(true)
}).unknown(); // Permite outras variáveis

// Valida variáveis
const { error, value: validatedEnv } = envSchema.validate(process.env);

if (error) {
    throw new Error(`Erro na validação das variáveis de ambiente: ${error.message}`);
}

// Exporta configuração validada
const config = {
    database: {
        host: validatedEnv.DB_HOST,
        user: validatedEnv.DB_USER,
        password: validatedEnv.DB_PASSWORD,
        database: validatedEnv.DB_NAME,
        port: validatedEnv.DB_PORT,
        connectionLimit: validatedEnv.DB_CONNECTION_LIMIT,
        queueLimit: validatedEnv.DB_QUEUE_LIMIT,
        waitForConnections: validatedEnv.DB_WAIT_FOR_CONNECTIONS,
        timezone: '+00:00'
    },
    
    server: {
        port: validatedEnv.PORT,
        env: validatedEnv.NODE_ENV,
        isDevelopment: validatedEnv.NODE_ENV === 'development',
        isProduction: validatedEnv.NODE_ENV === 'production',
        isTest: validatedEnv.NODE_ENV === 'test'
    },
    
    security: {
        allowedOrigins: validatedEnv.ALLOWED_ORIGINS.split(',').map(o => o.trim()),
        rateLimit: {
            windowMs: validatedEnv.RATE_LIMIT_WINDOW_MS,
            maxRequests: validatedEnv.RATE_LIMIT_MAX_REQUESTS
        }
    },
    
    cache: {
        enabled: validatedEnv.CACHE_ENABLED,
        ttl: {
            dashboard: validatedEnv.CACHE_TTL_DASHBOARD,
            analytics: validatedEnv.CACHE_TTL_ANALYTICS,
            search: validatedEnv.CACHE_TTL_SEARCH
        }
    },
    
    logging: {
        level: validatedEnv.LOG_LEVEL,
        fileEnabled: validatedEnv.LOG_FILE_ENABLED,
        filePath: validatedEnv.LOG_FILE_PATH
    },
    
    export: {
        maxRecords: validatedEnv.EXPORT_MAX_RECORDS
    },
    
    features: {
        cache: validatedEnv.ENABLE_CACHE,
        compression: validatedEnv.ENABLE_COMPRESSION,
        helmet: validatedEnv.ENABLE_HELMET
    }
};

// Log configuração (sem expor senhas)
if (config.server.isDevelopment) {
    console.log('📋 Configuração carregada:');
    console.log(`   - Ambiente: ${config.server.env}`);
    console.log(`   - Porta: ${config.server.port}`);
    console.log(`   - Database: ${config.database.database}@${config.database.host}`);
    console.log(`   - Cache: ${config.cache.enabled ? 'Ativado' : 'Desativado'}`);
    console.log(`   - Log Level: ${config.logging.level}`);
}

export default config;