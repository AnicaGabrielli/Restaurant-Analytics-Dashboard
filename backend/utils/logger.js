// ========== backend/utils/logger.js - COM DETALHES COMPLETOS ==========
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import config from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logsDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
        let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
        
        if (Object.keys(meta).length > 0) {
            log += ` | ${JSON.stringify(meta)}`;
        }
        
        if (stack) {
            log += `\n${stack}`;
        }
        
        return log;
    })
);

const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level}: ${message}`;
    })
);

const transports = [];

transports.push(
    new winston.transports.Console({
        format: consoleFormat,
        level: config.logging.level
    })
);

if (config.logging.fileEnabled) {
    transports.push(
        new winston.transports.File({
            filename: path.resolve(logsDir, 'app.log'),
            format: customFormat,
            level: config.logging.level,
            maxsize: 5242880,
            maxFiles: 5
        })
    );
    
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

const logger = winston.createLogger({
    level: config.logging.level,
    format: customFormat,
    transports,
    exitOnError: false
});

class Logger {
    info(message, meta = {}) {
        logger.info(message, meta);
    }
    
    warn(message, meta = {}) {
        logger.warn(message, meta);
    }
    
    error(message, error = null, meta = {}) {
        if (error instanceof Error) {
            // LOG COMPLETO DO ERRO SQL
            logger.error(message, {
                errorMessage: error.message,
                errorCode: error.code,
                errorErrno: error.errno,
                errorSql: error.sql,
                errorSqlMessage: error.sqlMessage,
                stack: error.stack,
                ...meta
            });
            
            // TAMBÉM NO CONSOLE
            console.error('\n=== ERRO DETALHADO ===');
            console.error('Mensagem:', error.message);
            console.error('Código:', error.code);
            console.error('SQL State:', error.sqlState);
            console.error('SQL Message:', error.sqlMessage);
            console.error('SQL:', error.sql);
            console.error('========================\n');
        } else {
            logger.error(message, meta);
        }
    }
    
    debug(message, meta = {}) {
        if (config.server.isDevelopment) {
            logger.debug(message, meta);
        }
    }
    
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
    
    query(sql, params = [], duration = 0) {
        if (config.server.isDevelopment) {
            this.debug(`SQL Query (${duration}ms)`, {
                sql: sql.substring(0, 200),
                params: params.length > 0 ? params : undefined
            });
        }
    }
    
    dbError(error, sql = '', params = []) {
        // LOG SUPER DETALHADO
        this.error('Database Error', error, {
            sql: sql.substring(0, 500),
            params: params.length > 0 ? params : undefined,
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
    }
    
    cache(action, key, hit = null) {
        if (config.server.isDevelopment) {
            const message = `Cache ${action}: ${key}`;
            this.debug(message, { hit });
        }
    }
}

export default new Logger();
export { logger as winstonLogger };