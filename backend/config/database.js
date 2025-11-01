// ========== backend/config/database.js - CORRIGIDO ==========
import mysql from 'mysql2/promise';
import config from './env.js';
import logger from '../utils/logger.js';
import { DatabaseError } from '../utils/errorHandler.js';

/**
 * Classe de gerenciamento de banco de dados
 */
class Database {
    constructor() {
        this.pool = null;
        this.isConnected = false;
    }
    
    /**
     * Cria connection pool
     */
    async connect() {
        if (this.pool) {
            return this.pool;
        }
        
        try {
            this.pool = mysql.createPool({
                host: config.database.host,
                user: config.database.user,
                password: config.database.password,
                database: config.database.database,
                port: config.database.port,
                connectionLimit: config.database.connectionLimit,
                queueLimit: config.database.queueLimit,
                waitForConnections: config.database.waitForConnections,
                timezone: config.database.timezone,
                enableKeepAlive: true,
                keepAliveInitialDelay: 10000,
                connectTimeout: 10000
            });
            
            // Testa conexão
            await this.testConnection();
            
            // Configura event handlers
            this.setupPoolHandlers();
            
            this.isConnected = true;
            logger.info('✅ Pool de conexões MySQL criado com sucesso', {
                host: config.database.host,
                database: config.database.database,
                connectionLimit: config.database.connectionLimit
            });
            
            return this.pool;
        } catch (error) {
            logger.error('❌ Erro ao criar pool de conexões MySQL', error);
            throw new DatabaseError('Falha ao conectar ao banco de dados', error);
        }
    }
    
    /**
     * Testa conexão com banco
     */
    async testConnection() {
        try {
            const connection = await this.pool.getConnection();
            await connection.ping();
            connection.release();
            logger.info('✅ Conexão com MySQL testada com sucesso');
        } catch (error) {
            logger.error('❌ Falha no teste de conexão MySQL', error);
            throw error;
        }
    }
    
    /**
     * Configura handlers de eventos do pool
     */
    setupPoolHandlers() {
        this.pool.on('acquire', (connection) => {
            logger.debug('Conexão adquirida do pool', {
                threadId: connection.threadId
            });
        });
        
        this.pool.on('connection', (connection) => {
            logger.debug('Nova conexão criada no pool', {
                threadId: connection.threadId
            });
        });
        
        this.pool.on('enqueue', () => {
            logger.warn('Aguardando conexão disponível no pool');
        });
        
        this.pool.on('release', (connection) => {
            logger.debug('Conexão liberada de volta ao pool', {
                threadId: connection.threadId
            });
        });
    }
    
    /**
     * Executa query com tratamento de erros e logging
     */
    async query(sql, params = []) {
        if (!this.pool) {
            await this.connect();
        }
        
        const startTime = Date.now();
        let connection;
        
        try {
            connection = await this.pool.getConnection();
            
            const [results] = await connection.execute(sql, params);
            
            const duration = Date.now() - startTime;
            logger.query(sql, params, duration);
            
            return results;
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.dbError(error, sql, params);
            
            error.query = sql;
            error.params = params;
            error.duration = duration;
            
            throw error;
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
    
    /**
     * Executa múltiplas queries em transação
     */
    async transaction(callback) {
        if (!this.pool) {
            await this.connect();
        }
        
        const connection = await this.pool.getConnection();
        
        try {
            await connection.beginTransaction();
            logger.debug('Transação iniciada');
            
            const result = await callback(connection);
            
            await connection.commit();
            logger.debug('Transação commitada com sucesso');
            
            return result;
        } catch (error) {
            await connection.rollback();
            logger.error('Transação revertida devido a erro', error);
            throw error;
        } finally {
            connection.release();
        }
    }
    
    /**
     * Verifica saúde da conexão
     */
    async healthCheck() {
        try {
            const startTime = Date.now();
            await this.query('SELECT 1 as health');
            const duration = Date.now() - startTime;
            
            return {
                status: 'healthy',
                responseTime: duration,
                poolStats: {
                    totalConnections: this.pool.pool._allConnections.length,
                    freeConnections: this.pool.pool._freeConnections.length,
                    queuedRequests: this.pool.pool._connectionQueue.length
                }
            };
        } catch (error) {
            logger.error('Health check falhou', error);
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
    
    /**
     * Fecha pool de conexões gracefully
     */
    async close() {
        if (this.pool) {
            try {
                await this.pool.end();
                this.pool = null;
                this.isConnected = false;
                logger.info('✅ Pool de conexões MySQL encerrado com sucesso');
            } catch (error) {
                logger.error('❌ Erro ao encerrar pool de conexões', error);
                throw error;
            }
        }
    }
    
    /**
     * Retorna estatísticas do pool
     */
    getPoolStats() {
        if (!this.pool) {
            return null;
        }
        
        return {
            totalConnections: this.pool.pool._allConnections.length,
            freeConnections: this.pool.pool._freeConnections.length,
            queuedRequests: this.pool.pool._connectionQueue.length,
            isConnected: this.isConnected
        };
    }
}

// Exporta instância única (Singleton)
const database = new Database();

export default database;

/**
 * Hook para graceful shutdown
 */
export const gracefulShutdown = async (signal) => {
    logger.info(`${signal} recebido. Encerrando conexões do banco...`);
    try {
        await database.close();
        process.exit(0);
    } catch (error) {
        logger.error('Erro durante shutdown do banco', error);
        process.exit(1);
    }
};

// Registra handlers de shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));