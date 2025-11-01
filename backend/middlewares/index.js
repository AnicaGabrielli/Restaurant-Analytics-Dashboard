// ========== backend/middlewares/index.js ==========
// Middlewares de segurança, logging e validação

import helmet from 'helmet';
import compression from 'compression';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import config from '../config/env.js';
import logger from '../utils/logger.js';
import { ValidationError } from '../utils/errorHandler.js';

/**
 * Middleware de logging de requisições HTTP
 */
export const httpLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // Captura quando resposta é finalizada
    res.on('finish', () => {
        const duration = Date.now() - startTime;
        logger.http(req, res, duration);
    });
    
    next();
};

/**
 * Middleware de segurança com Helmet
 */
export const securityHeaders = helmet({
    contentSecurityPolicy: config.server.isProduction ? undefined : false,
    crossOriginEmbedderPolicy: false,
    // Configurações adicionais podem ser adicionadas aqui
});

/**
 * Middleware de compressão
 */
export const compressionMiddleware = compression({
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    },
    threshold: 1024 // Só comprime se > 1KB
});

/**
 * Middleware de CORS configurado
 */
export const corsMiddleware = cors({
    origin: (origin, callback) => {
        // Permite requisições sem origin (mobile apps, Postman, etc)
        if (!origin) {
            return callback(null, true);
        }
        
        // Em desenvolvimento, permite tudo
        if (config.server.isDevelopment) {
            return callback(null, true);
        }
        
        // Em produção, verifica lista de origens permitidas
        if (config.security.allowedOrigins.includes('*') || 
            config.security.allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn(`Origem bloqueada por CORS: ${origin}`);
            callback(new Error('Origem não permitida por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Range', 'X-Total-Count'],
    maxAge: 86400 // 24 horas
});

/**
 * Rate Limiting para proteger contra DDoS
 */
export const rateLimiter = rateLimit({
    windowMs: config.security.rateLimit.windowMs,
    max: config.security.rateLimit.maxRequests,
    message: {
        success: false,
        error: 'Muitas requisições. Tente novamente mais tarde.',
        retryAfter: config.security.rateLimit.windowMs / 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn('Rate limit excedido', {
            ip: req.ip,
            path: req.originalUrl
        });
        res.status(429).json({
            success: false,
            error: 'Muitas requisições. Tente novamente mais tarde.'
        });
    }
});

/**
 * Rate limiter mais agressivo para endpoints de exportação
 */
export const exportRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 exportações por 15 minutos
    message: {
        success: false,
        error: 'Limite de exportações excedido. Aguarde 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * Middleware de validação de query parameters
 */
export const validateQueryParams = (allowedParams = []) => {
    return (req, res, next) => {
        const receivedParams = Object.keys(req.query);
        const invalidParams = receivedParams.filter(param => !allowedParams.includes(param));
        
        if (invalidParams.length > 0) {
            logger.warn('Query parameters inválidos detectados', {
                path: req.originalUrl,
                invalidParams
            });
            return next(new ValidationError('Parâmetros de consulta inválidos', {
                invalidParams
            }));
        }
        
        next();
    };
};

/**
 * Middleware de sanitização de inputs
 */
export const sanitizeInputs = (req, res, next) => {
    // Sanitiza body
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    
    // Sanitiza query params
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    
    // Sanitiza params
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    
    next();
};

/**
 * Função auxiliar para sanitizar objetos
 */
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            
            if (typeof value === 'string') {
                // Remove caracteres perigosos
                sanitized[key] = value
                    .replace(/<script[^>]*>.*?<\/script>/gi, '')
                    .replace(/<[^>]+>/g, '')
                    .trim();
            } else if (typeof value === 'object') {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
    }
    
    return sanitized;
}

/**
 * Middleware de validação de Content-Type
 */
export const validateContentType = (req, res, next) => {
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
        if (!req.is('application/json')) {
            return next(new ValidationError('Content-Type deve ser application/json'));
        }
    }
    next();
};

/**
 * Middleware de timeout para requisições
 */
export const requestTimeout = (timeoutMs = 30000) => {
    return (req, res, next) => {
        req.setTimeout(timeoutMs, () => {
            logger.warn('Requisição expirou por timeout', {
                path: req.originalUrl,
                timeout: timeoutMs
            });
            
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    error: 'Requisição expirou. Tente novamente.'
                });
            }
        });
        
        next();
    };
};

/**
 * Middleware de cache headers para assets estáticos
 */
export const cacheControl = (maxAge = 86400) => {
    return (req, res, next) => {
        if (req.method === 'GET') {
            res.set('Cache-Control', `public, max-age=${maxAge}`);
        }
        next();
    };
};

/**
 * Middleware que adiciona headers úteis de resposta
 */
export const responseHeaders = (req, res, next) => {
    res.set('X-Powered-By', 'Restaurant Analytics');
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('X-XSS-Protection', '1; mode=block');
    next();
};

/**
 * Exporta todos os middlewares configurados
 */
export default {
    httpLogger,
    securityHeaders,
    compressionMiddleware,
    corsMiddleware,
    rateLimiter,
    exportRateLimiter,
    validateQueryParams,
    sanitizeInputs,
    validateContentType,
    requestTimeout,
    cacheControl,
    responseHeaders
};