// ========== backend/utils/logger.js ==========
// Sistema centralizado de logging com Winston

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import config from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cria diretório de logs se não existir
const logsDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Formato customizado para logs
const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        
        // Adiciona metadata se existir
        if (Object.keys(meta).length > 0) {
            log += ` | ${JSON.stringify(meta)}`;
        }
        
        // Adiciona stack trace para erros
        if (stack) {
            log += `\n${stack}`;
        }
        
        return log;
    })
);

// Formato colorido para console
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level}: ${message}`;
    })
);

// Transports
const transports = [];

// Console transport (sempre ativo)
transports.push(
    new winston.transports.Console({
        format: consoleFormat,
        level: config.logging.level
    })
);

// File transport (se habilitado)
if (config.logging.fileEnabled) {
    // Arquivo geral
    transports.push(
        new winston.transports.File({
            filename: path.resolve(logsDir, 'app.log'),
            format: customFormat,
            level: config.logging.level,
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    );
    
    // Arquivo só de erros
    transports.push(
        new winston.transports.File({
            filename: path.resolve(logsDir, 'error.log'),
            format: customFormat,
            level: 'error',
            maxsize: 5242880,
            maxFiles: 5
        })
    );
}

// Cria logger
const logger = winston.createLogger({
    level: config.logging.level,
    format: customFormat,
    transports,
    exitOnError: false
});

// Wrapper para facilitar uso
class Logger {
    /**
     * Log de informação
     */
    info(message, meta = {}) {
        logger.info(message, meta);
    }
    
    /**
     * Log de warning
     */
    warn(message, meta = {}) {
        logger.warn(message, meta);
    }
    
    /**
     * Log de erro
     */
    error(message, error = null, meta = {}) {
        if (error instanceof Error) {
            logger.error(message, {
                error: error.message,
                stack: error.stack,
                ...meta
            });
        } else {
            logger.error(message, meta);
        }
    }
    
    /**
     * Log de debug (só em desenvolvimento)
     */
    debug(message, meta = {}) {
        if (config.server.isDevelopment) {
            logger.debug(message, meta);
        }
    }
    
    /**
     * Log de requisição HTTP
     */
    http(req, res, duration) {
        const message = `${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`;
        
        if (res.statusCode >= 500) {
            this.error(message);
        } else if (res.statusCode >= 400) {
            this.warn(message);
        } else {
            this.info(message);
        }
    }
    
    /**
     * Log de query SQL (só em desenvolvimento)
     */
    query(sql, params = [], duration = 0) {
        if (config.server.isDevelopment) {
            this.debug(`SQL Query (${duration}ms)`, {
                sql: sql.substring(0, 200), // Limita tamanho
                params: params.length > 0 ? params : undefined
            });
        }
    }
    
    /**
     * Log de erro de banco de dados
     */
    dbError(error, sql = '', params = []) {
        this.error('Database Error', error, {
            sql: sql.substring(0, 200),
            params: params.length > 0 ? params : undefined,
            code: error.code,
            errno: error.errno
        });
    }
    
    /**
     * Log de cache
     */
    cache(action, key, hit = null) {
        if (config.server.isDevelopment) {
            const message = `Cache ${action}: ${key}`;
            this.debug(message, { hit });
        }
    }
}

// Exporta instância única
export default new Logger();

// Exporta logger Winston original para casos especiais
export { logger as winstonLogger };