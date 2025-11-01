// ========== backend/config/database.js - POOL OTIMIZADO ==========
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
            logger.debug('Pool já existente, retornando pool atual');
            return this.pool;
        }
        
        try {
            logger.info('🔄 Criando pool de conexões MySQL...');

            // Cria pool (SEM acquireTimeout - não é suportado no mysql2)
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
                connectTimeout: config.database.connectTimeout
            });
            
            // Testa pool
            await this.testConnection();
            
            // Configura event handlers
            this.setupPoolHandlers();
            
            this.isConnected = true;
            logger.info('✅ Pool de conexões MySQL criado', {
                connectionLimit: config.database.connectionLimit,
                database: config.database.database
            });
            
            return this.pool;
        } catch (error) {
            logger.error('❌ Erro ao criar pool MySQL:', error);
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
            logger.info('✅ Pool testado com sucesso');
        } catch (error) {
            logger.error('❌ Falha no teste do pool:', error);
            throw error;
        }
    }
    
    /**
     * Configura handlers de eventos do pool
     */
    setupPoolHandlers() {
        this.pool.on('acquire', (connection) => {
            logger.debug(`Conexão ${connection.threadId} adquirida`);
        });
        
        this.pool.on('connection', (connection) => {
            logger.debug(`Nova conexão ${connection.threadId} criada`);
        });
        
        this.pool.on('enqueue', () => {
            const stats = this.getPoolStats();
            logger.warn(`⚠️ Aguardando conexão (Pool: ${stats.totalConnections}/${config.database.connectionLimit}, Fila: ${stats.queuedRequests})`);
        });
        
        this.pool.on('release', (connection) => {
            logger.debug(`Conexão ${connection.threadId} liberada`);
        });
    }
    
    /**
     * Executa query com tratamento de erros
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
            
            if (duration > 1000) {
                logger.warn(`Query lenta (${duration}ms): ${sql.substring(0, 100)}`);
            } else {
                logger.debug(`Query executada (${duration}ms)`);
            }
            
            return results;
        } catch (error) {
            const duration = Date.now() - startTime;
            logger.error(`Erro na query (${duration}ms):`, {
                error: error.message,
                code: error.code,
                sql: sql.substring(0, 200),
                params: params.length
            });
            
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
            logger.debug('Transação commitada');
            
            return result;
        } catch (error) {
            await connection.rollback();
            logger.error('Transação revertida:', error);
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
                poolStats: this.getPoolStats()
            };
        } catch (error) {
            logger.error('Health check falhou:', error);
            return {
                status: 'unhealthy',
                error: error.message
            };
        }
    }
    
    /**
     * Fecha pool gracefully
     */
    async close() {
        if (this.pool) {
            try {
                await this.pool.end();
                this.pool = null;
                this.isConnected = false;
                logger.info('✅ Pool MySQL encerrado');
            } catch (error) {
                logger.error('❌ Erro ao encerrar pool:', error);
                throw error;
            }
        }
    }
    
    /**
     * Retorna estatísticas do pool
     */
    getPoolStats() {
        if (!this.pool || !this.pool.pool) {
            return {
                totalConnections: 0,
                freeConnections: 0,
                queuedRequests: 0,
                isConnected: false
            };
        }
        
        return {
            totalConnections: this.pool.pool._allConnections?.length || 0,
            freeConnections: this.pool.pool._freeConnections?.length || 0,
            queuedRequests: this.pool.pool._connectionQueue?.length || 0,
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
    logger.info(`${signal} recebido. Encerrando conexões...`);
    try {
        await database.close();
        process.exit(0);
    } catch (error) {
        logger.error('Erro durante shutdown:', error);
        process.exit(1);
    }
};

// Registra handlers de shutdown
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));