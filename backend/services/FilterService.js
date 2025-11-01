// ========== backend/services/FilterService.js ==========
// Construção dinâmica e segura de filtros SQL com validação

import Joi from 'joi';
import logger from '../utils/logger.js';
import { ValidationError } from '../utils/errorHandler.js';

/**
 * Serviço de construção de filtros SQL dinâmicos
 */
export class FilterService {
    constructor() {
        // Schema de validação de filtros
        this.filterSchema = Joi.object({
            // Período
            period: Joi.string().valid(
                'last7days', 'last30days', 'last90days',
                'thisMonth', 'lastMonth', 'thisYear', 'lastYear'
            ),
            startDate: Joi.date().iso(),
            endDate: Joi.date().iso().min(Joi.ref('startDate')),
            
            // IDs
            channelIds: Joi.alternatives().try(
                Joi.array().items(Joi.number().integer().positive()),
                Joi.number().integer().positive()
            ),
            storeIds: Joi.alternatives().try(
                Joi.array().items(Joi.number().integer().positive()),
                Joi.number().integer().positive()
            ),
            categoryId: Joi.number().integer().positive(),
            customerId: Joi.number().integer().positive(),
            
            // Status
            status: Joi.alternatives().try(
                Joi.string().valid('COMPLETED', 'CANCELLED', 'ALL'),
                Joi.array().items(Joi.string().valid('COMPLETED', 'CANCELLED'))
            ),
            
            // Valores
            minAmount: Joi.number().min(0),
            maxAmount: Joi.number().min(Joi.ref('minAmount')),
            
            // Busca
            search: Joi.string().max(100),
            searchField: Joi.string().valid('product', 'customer', 'sale'),
            
            // Paginação
            page: Joi.number().integer().min(1).default(1),
            limit: Joi.number().integer().min(1).max(1000).default(50),
            
            // Ordenação
            sortBy: Joi.string(),
            sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
        }).oxor('period', 'startDate'); // Ou period OU startDate, não ambos
    }
    
    /**
     * Valida e normaliza filtros
     */
    validateFilters(filters) {
        const { error, value } = this.filterSchema.validate(filters, {
            stripUnknown: true,
            abortEarly: false
        });
        
        if (error) {
            const details = error.details.map(d => ({
                field: d.path.join('.'),
                message: d.message
            }));
            
            logger.warn('Validação de filtros falhou', { details });
            throw new ValidationError('Filtros inválidos', { details });
        }
        
        // Normaliza arrays
        if (value.channelIds && !Array.isArray(value.channelIds)) {
            value.channelIds = [value.channelIds];
        }
        
        if (value.storeIds && !Array.isArray(value.storeIds)) {
            value.storeIds = [value.storeIds];
        }
        
        if (value.status && !Array.isArray(value.status) && value.status !== 'ALL') {
            value.status = [value.status];
        }
        
        return value;
    }
    
    /**
     * Constrói WHERE clause com alias de tabela para evitar ambiguidade
     * @param {Object} filters - Filtros validados
     * @param {string} tableAlias - Alias da tabela (ex: 's' para sales)
     * @returns {Object} {where: string, params: array}
     */
    buildWhereClause(filters, tableAlias = '') {
        const conditions = [];
        const params = [];
        const prefix = tableAlias ? `${tableAlias}.` : '';
        
        // Status
        if (filters.status && filters.status !== 'ALL') {
            if (Array.isArray(filters.status)) {
                const placeholders = filters.status.map(() => '?').join(',');
                conditions.push(`${prefix}sale_status_desc IN (${placeholders})`);
                params.push(...filters.status);
            } else {
                conditions.push(`${prefix}sale_status_desc = ?`);
                params.push(filters.status);
            }
        }
        
        // Período customizado
        if (filters.startDate && filters.endDate) {
            conditions.push(`${prefix}created_at BETWEEN ? AND ?`);
            params.push(filters.startDate, filters.endDate);
        }
        // Período predefinido
        else if (filters.period) {
            const periodClause = this.buildPeriodClause(filters.period, prefix);
            if (periodClause) {
                conditions.push(periodClause);
            }
        }
        
        // Canais
        if (filters.channelIds && filters.channelIds.length > 0) {
            const placeholders = filters.channelIds.map(() => '?').join(',');
            conditions.push(`${prefix}channel_id IN (${placeholders})`);
            params.push(...filters.channelIds);
        }
        
        // Lojas
        if (filters.storeIds && filters.storeIds.length > 0) {
            const placeholders = filters.storeIds.map(() => '?').join(',');
            conditions.push(`${prefix}store_id IN (${placeholders})`);
            params.push(...filters.storeIds);
        }
        
        // Categoria
        if (filters.categoryId) {
            conditions.push(`${prefix}category_id = ?`);
            params.push(filters.categoryId);
        }
        
        // Cliente
        if (filters.customerId) {
            conditions.push(`${prefix}customer_id = ?`);
            params.push(filters.customerId);
        }
        
        // Valor mínimo
        if (filters.minAmount !== undefined) {
            conditions.push(`${prefix}total_amount >= ?`);
            params.push(filters.minAmount);
        }
        
        // Valor máximo
        if (filters.maxAmount !== undefined) {
            conditions.push(`${prefix}total_amount <= ?`);
            params.push(filters.maxAmount);
        }
        
        const whereClause = conditions.length > 0 
            ? `WHERE ${conditions.join(' AND ')}` 
            : '';
        
        return { where: whereClause, params };
    }
    
    /**
     * Constrói cláusula de período predefinido
     */
    buildPeriodClause(period, prefix = '') {
        const col = `${prefix}created_at`;
        
        const periodMap = {
            'last7days': `${col} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`,
            'last30days': `${col} >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
            'last90days': `${col} >= DATE_SUB(NOW(), INTERVAL 90 DAY)`,
            'thisMonth': `YEAR(${col}) = YEAR(NOW()) AND MONTH(${col}) = MONTH(NOW())`,
            'lastMonth': `${col} >= DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 MONTH), '%Y-%m-01') 
                          AND ${col} < DATE_FORMAT(NOW(), '%Y-%m-01')`,
            'thisYear': `YEAR(${col}) = YEAR(NOW())`,
            'lastYear': `YEAR(${col}) = YEAR(NOW()) - 1`
        };
        
        return periodMap[period] || null;
    }
    
    /**
     * Constrói cláusula ORDER BY segura
     */
    buildOrderClause(allowedFields, sortBy, sortOrder = 'DESC', prefix = '') {
        // Validação
        if (!allowedFields.includes(sortBy)) {
            sortBy = allowedFields[0] || 'id';
        }
        
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
        const field = prefix ? `${prefix}.${sortBy}` : sortBy;
        
        return `ORDER BY ${field} ${order}`;
    }
    
    /**
     * Constrói cláusula LIMIT e OFFSET seguros
     */
    buildLimitClause(page = 1, limit = 50) {
        const maxLimit = 1000;
        const safeLimit = Math.min(Math.max(1, parseInt(limit) || 50), maxLimit);
        const safePage = Math.max(1, parseInt(page) || 1);
        const offset = (safePage - 1) * safeLimit;
        
        return {
            clause: `LIMIT ${safeLimit} OFFSET ${offset}`,
            limit: safeLimit,
            offset,
            page: safePage
        };
    }
    
    /**
     * Constrói cláusula de busca textual
     */
    buildSearchClause(searchTerm, searchFields, prefix = '') {
        if (!searchTerm || searchTerm.length < 2) {
            return { clause: '', params: [] };
        }
        
        const searchPattern = `%${searchTerm}%`;
        const conditions = searchFields.map(field => {
            const fullField = prefix ? `${prefix}.${field}` : field;
            return `${fullField} LIKE ?`;
        });
        
        return {
            clause: `(${conditions.join(' OR ')})`,
            params: Array(searchFields.length).fill(searchPattern)
        };
    }
    
    /**
     * Gera chave de cache baseada em filtros
     */
    generateCacheKey(prefix, filters) {
        // Remove campos não relevantes para cache
        const { page, limit, ...relevantFilters } = filters;
        
        // Ordena chaves para consistência
        const sortedKeys = Object.keys(relevantFilters).sort();
        const keyParts = sortedKeys.map(key => {
            const value = relevantFilters[key];
            if (Array.isArray(value)) {
                return `${key}:${value.sort().join(',')}`;
            }
            return `${key}:${value}`;
        });
        
        return `${prefix}:${keyParts.join('|')}`;
    }
    
    /**
     * Extrai período anterior para comparações
     */
    calculatePreviousPeriod(filters) {
        const previousFilters = { ...filters };
        
        if (filters.startDate && filters.endDate) {
            const start = new Date(filters.startDate);
            const end = new Date(filters.endDate);
            const duration = end - start;
            
            previousFilters.startDate = new Date(start.getTime() - duration)
                .toISOString().split('T')[0];
            previousFilters.endDate = new Date(start.getTime() - 1)
                .toISOString().split('T')[0];
            
            delete previousFilters.period;
        } else if (filters.period) {
            const periodMap = {
                'last7days': 'previous7days',
                'last30days': 'previous30days',
                'last90days': 'previous90days',
                'thisMonth': 'lastMonth',
                'thisYear': 'lastYear'
            };
            
            previousFilters.period = periodMap[filters.period] || filters.period;
        }
        
        return previousFilters;
    }
    
    /**
     * Constrói query completa de contagem
     */
    buildCountQuery(table, filters, tableAlias = '') {
        const { where, params } = this.buildWhereClause(filters, tableAlias);
        const tableRef = tableAlias ? `${table} ${tableAlias}` : table;
        
        return {
            sql: `SELECT COUNT(*) as total FROM ${tableRef} ${where}`,
            params
        };
    }
    
    /**
     * Valida e sanitiza input de busca
     */
    sanitizeSearchTerm(term) {
        if (!term || typeof term !== 'string') {
            return '';
        }
        
        return term
            .trim()
            .substring(0, 100)
            .replace(/[<>'"`;]/g, ''); // Remove caracteres perigosos
    }
}

export default new FilterService();