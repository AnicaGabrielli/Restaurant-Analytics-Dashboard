// ========== backend/models/BaseModel.js ==========
// Classe base para todos os Models com OOP e métodos comuns

import database from '../config/database.js';
import logger from '../utils/logger.js';
import { DatabaseError, NotFoundError } from '../utils/errorHandler.js';

/**
 * Classe base para Models com funcionalidades comuns
 */
export class BaseModel {
    constructor(tableName) {
        if (!tableName) {
            throw new Error('Nome da tabela é obrigatório');
        }
        
        this.tableName = tableName;
        this.db = database;
    }
    
    /**
     * Busca todos os registros com limite
     */
    async findAll(limit = 100, offset = 0) {
        try {
            const query = `
                SELECT * FROM ${this.tableName}
                ORDER BY id DESC
                LIMIT ? OFFSET ?
            `;
            
            return await this.db.query(query, [limit, offset]);
        } catch (error) {
            throw new DatabaseError(`Erro ao buscar registros de ${this.tableName}`, error);
        }
    }
    
    /**
     * Busca registro por ID
     */
    async findById(id) {
        try {
            const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
            const results = await this.db.query(query, [id]);
            
            if (!results || results.length === 0) {
                throw new NotFoundError(`${this.tableName} com ID ${id}`);
            }
            
            return results[0];
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError(`Erro ao buscar ${this.tableName} por ID`, error);
        }
    }
    
    /**
     * Busca registros por condição customizada
     */
    async findWhere(conditions = {}, limit = 100) {
        try {
            const { where, params } = this.buildWhereFromObject(conditions);
            
            const query = `
                SELECT * FROM ${this.tableName}
                ${where}
                LIMIT ?
            `;
            
            return await this.db.query(query, [...params, limit]);
        } catch (error) {
            throw new DatabaseError(`Erro ao buscar ${this.tableName} com condições`, error);
        }
    }
    
    /**
     * Busca um único registro por condição
     */
    async findOne(conditions = {}) {
        try {
            const results = await this.findWhere(conditions, 1);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            throw new DatabaseError(`Erro ao buscar um registro de ${this.tableName}`, error);
        }
    }
    
    /**
     * Conta registros total
     */
    async count(conditions = {}) {
        try {
            const { where, params } = this.buildWhereFromObject(conditions);
            
            const query = `
                SELECT COUNT(*) as total
                FROM ${this.tableName}
                ${where}
            `;
            
            const results = await this.db.query(query, params);
            return results[0].total;
        } catch (error) {
            throw new DatabaseError(`Erro ao contar registros de ${this.tableName}`, error);
        }
    }
    
    /**
     * Cria novo registro
     */
    async create(data) {
        try {
            const { columns, placeholders, values } = this.prepareInsertData(data);
            
            const query = `
                INSERT INTO ${this.tableName} (${columns})
                VALUES (${placeholders})
            `;
            
            const result = await this.db.query(query, values);
            
            logger.info(`Registro criado em ${this.tableName}`, {
                id: result.insertId
            });
            
            return {
                id: result.insertId,
                ...data
            };
        } catch (error) {
            throw new DatabaseError(`Erro ao criar registro em ${this.tableName}`, error);
        }
    }
    
    /**
     * Atualiza registro por ID
     */
    async update(id, data) {
        try {
            const { setClause, values } = this.prepareUpdateData(data);
            
            const query = `
                UPDATE ${this.tableName}
                SET ${setClause}
                WHERE id = ?
            `;
            
            const result = await this.db.query(query, [...values, id]);
            
            if (result.affectedRows === 0) {
                throw new NotFoundError(`${this.tableName} com ID ${id}`);
            }
            
            logger.info(`Registro atualizado em ${this.tableName}`, { id });
            
            return await this.findById(id);
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError(`Erro ao atualizar ${this.tableName}`, error);
        }
    }
    
    /**
     * Deleta registro por ID (soft delete se coluna deleted_at existir)
     */
    async delete(id, soft = true) {
        try {
            let query;
            let result;
            
            if (soft && await this.hasColumn('deleted_at')) {
                query = `
                    UPDATE ${this.tableName}
                    SET deleted_at = NOW()
                    WHERE id = ? AND deleted_at IS NULL
                `;
                result = await this.db.query(query, [id]);
            } else {
                query = `DELETE FROM ${this.tableName} WHERE id = ?`;
                result = await this.db.query(query, [id]);
            }
            
            if (result.affectedRows === 0) {
                throw new NotFoundError(`${this.tableName} com ID ${id}`);
            }
            
            logger.info(`Registro deletado de ${this.tableName}`, { id, soft });
            
            return { success: true, id };
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw error;
            }
            throw new DatabaseError(`Erro ao deletar ${this.tableName}`, error);
        }
    }
    
    /**
     * Executa query SQL diretamente (para queries customizadas)
     */
    async query(sql, params = []) {
        try {
            return await this.db.query(sql, params);
        } catch (error) {
            throw new DatabaseError(`Erro ao executar query em ${this.tableName}`, error);
        }
    }
    
    /**
     * Executa múltiplas queries em transação
     */
    async transaction(callback) {
        try {
            return await this.db.transaction(callback);
        } catch (error) {
            throw new DatabaseError(`Erro em transação de ${this.tableName}`, error);
        }
    }
    
    /**
     * Verifica se coluna existe na tabela
     */
    async hasColumn(columnName) {
        try {
            const query = `
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND COLUMN_NAME = ?
            `;
            
            const results = await this.db.query(query, [this.tableName, columnName]);
            return results.length > 0;
        } catch (error) {
            logger.error(`Erro ao verificar coluna ${columnName}`, error);
            return false;
        }
    }
    
    /**
     * Constrói WHERE clause de objeto
     * @private
     */
    buildWhereFromObject(conditions) {
        if (!conditions || Object.keys(conditions).length === 0) {
            return { where: '', params: [] };
        }
        
        const whereParts = [];
        const params = [];
        
        for (const [key, value] of Object.entries(conditions)) {
            if (value === null) {
                whereParts.push(`${key} IS NULL`);
            } else if (Array.isArray(value)) {
                const placeholders = value.map(() => '?').join(',');
                whereParts.push(`${key} IN (${placeholders})`);
                params.push(...value);
            } else {
                whereParts.push(`${key} = ?`);
                params.push(value);
            }
        }
        
        return {
            where: `WHERE ${whereParts.join(' AND ')}`,
            params
        };
    }
    
    /**
     * Prepara dados para INSERT
     * @private
     */
    prepareInsertData(data) {
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        
        return { columns, placeholders, values };
    }
    
    /**
     * Prepara dados para UPDATE
     * @private
     */
    prepareUpdateData(data) {
        const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
        const values = Object.values(data);
        
        return { setClause, values };
    }
    
    /**
     * Sanitiza valores para prevenir SQL injection
     * @private
     */
    sanitizeValue(value) {
        if (typeof value === 'string') {
            return value.replace(/['";\\]/g, '');
        }
        return value;
    }
    
    /**
     * Retorna informações sobre a tabela
     */
    async getTableInfo() {
        try {
            const query = `
                SELECT 
                    COLUMN_NAME,
                    DATA_TYPE,
                    IS_NULLABLE,
                    COLUMN_KEY,
                    EXTRA
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                ORDER BY ORDINAL_POSITION
            `;
            
            return await this.db.query(query, [this.tableName]);
        } catch (error) {
            throw new DatabaseError(`Erro ao obter informações da tabela ${this.tableName}`, error);
        }
    }
}

export default BaseModel;