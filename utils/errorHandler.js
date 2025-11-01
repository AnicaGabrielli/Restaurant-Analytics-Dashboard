// ========== backend/utils/errorHandler.js ==========
// Sistema centralizado de tratamento de erros

import logger from './logger.js';
import config from '../config/env.js';

/**
 * Classe base para erros customizados
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Erros específicos
 */
export class ValidationError extends AppError {
    constructor(message, details = {}) {
        super(message, 400, true);
        this.name = 'ValidationError';
        this.details = details;
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} não encontrado`, 404, true);
        this.name = 'NotFoundError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Acesso não autorizado') {
        super(message, 401, true);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Acesso proibido') {
        super(message, 403, true);
        this.name = 'ForbiddenError';
    }
}

export class DatabaseError extends AppError {
    constructor(message, originalError = null) {
        super(message, 500, true);
        this.name = 'DatabaseError';
        this.originalError = originalError;
    }
}

export class ExportLimitError extends AppError {
    constructor(limit) {
        super(`Limite de exportação excedido. Máximo: ${limit} registros`, 400, true);
        this.name = 'ExportLimitError';
    }
}

/**
 * Classe de tratamento centralizado de erros
 */
class ErrorHandler {
    /**
     * Verifica se erro é operacional (esperado)
     */
    isOperationalError(error) {
        if (error instanceof AppError) {
            return error.isOperational;
        }
        return false;
    }
    
    /**
     * Trata erro de banco de dados MySQL
     */
    handleDatabaseError(error) {
        logger.dbError(error);
        
        // Erros específicos do MySQL
        switch (error.code) {
            case 'ER_DUP_ENTRY':
                return new DatabaseError('Registro duplicado', error);
            
            case 'ER_NO_REFERENCED_ROW':
            case 'ER_NO_REFERENCED_ROW_2':
                return new DatabaseError('Referência inválida', error);
            
            case 'ER_BAD_FIELD_ERROR':
                return new DatabaseError('Campo inválido na consulta', error);
            
            case 'ER_PARSE_ERROR':
                return new DatabaseError('Erro de sintaxe SQL', error);
            
            case 'ECONNREFUSED':
                return new DatabaseError('Conexão com banco de dados recusada', error);
            
            case 'ER_ACCESS_DENIED_ERROR':
                return new DatabaseError('Acesso negado ao banco de dados', error);
            
            case 'ER_NON_UNIQ_ERROR':
                return new DatabaseError('Coluna ambígua na consulta', error);
            
            default:
                return new DatabaseError('Erro ao processar operação no banco de dados', error);
        }
    }
    
    /**
     * Formata resposta de erro para cliente
     */
    formatErrorResponse(error, req) {
        const response = {
            success: false,
            error: error.message || 'Erro interno do servidor',
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
            method: req.method
        };
        
        // Em desenvolvimento, inclui mais detalhes
        if (config.server.isDevelopment) {
            response.stack = error.stack;
            response.details = error.details || {};
            
            if (error.originalError) {
                response.originalError = {
                    message: error.originalError.message,
                    code: error.originalError.code,
                    errno: error.originalError.errno
                };
            }
        }
        
        return response;
    }
    
    /**
     * Middleware de tratamento de erros para Express
     */
    expressErrorHandler() {
        return (error, req, res, next) => {
            // Se headers já foram enviados, delega para handler padrão
            if (res.headersSent) {
                return next(error);
            }
            
            // Trata erro de banco de dados
            if (error.code && error.code.startsWith('ER_')) {
                error = this.handleDatabaseError(error);
            }
            
            // Log do erro
            if (this.isOperationalError(error)) {
                logger.warn(`Erro operacional: ${error.message}`, {
                    path: req.originalUrl,
                    method: req.method,
                    statusCode: error.statusCode
                });
            } else {
                logger.error(`Erro não tratado: ${error.message}`, error, {
                    path: req.originalUrl,
                    method: req.method
                });
            }
            
            // Determina status code
            const statusCode = error.statusCode || 500;
            
            // Formata e envia resposta
            const response = this.formatErrorResponse(error, req);
            res.status(statusCode).json(response);
        };
    }
    
    /**
     * Handler para erros não capturados
     */
    handleUncaughtException(error) {
        logger.error('UNCAUGHT EXCEPTION! Encerrando aplicação...', error);
        
        // Em produção, tenta graceful shutdown
        if (config.server.isProduction) {
            process.exit(1);
        }
    }
    
    /**
     * Handler para promises rejeitadas não tratadas
     */
    handleUnhandledRejection(reason, promise) {
        logger.error('UNHANDLED REJECTION!', new Error(reason), {
            promise: promise.toString()
        });
        
        // Em produção, encerra aplicação
        if (config.server.isProduction) {
            throw new Error(reason);
        }
    }
    
    /**
     * Configura handlers globais
     */
    setupGlobalHandlers() {
        // Uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.handleUncaughtException(error);
        });
        
        // Unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            this.handleUnhandledRejection(reason, promise);
        });
        
        // Graceful shutdown em SIGTERM
        process.on('SIGTERM', () => {
            logger.info('SIGTERM recebido. Encerrando gracefully...');
            process.exit(0);
        });
        
        // Graceful shutdown em SIGINT (Ctrl+C)
        process.on('SIGINT', () => {
            logger.info('SIGINT recebido. Encerrando gracefully...');
            process.exit(0);
        });
    }
}

// Exporta instância única
export default new ErrorHandler();

/**
 * Wrapper async para rotas Express
 * Captura erros automaticamente e passa para error handler
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Middleware para 404
 */
export const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Rota ${req.originalUrl}`);
    next(error);
};