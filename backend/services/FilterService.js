// ========== backend/services/FilterService.js - CORRIGIDO ==========
/**
 * Serviço de construção dinâmica de filtros SQL
 * Suporta múltiplos filtros combinados com segurança
 */

export class FilterService {
    constructor() {
        // Campos permitidos para ordenação (previne SQL injection)
        this.allowedSortFields = {
            sales: ['created_at', 'total_amount', 'sale_status_desc'],
            products: ['name', 'id'],
            customers: ['customer_name', 'email', 'created_at'],
            stores: ['name', 'city']
        };

        // Operadores permitidos
        this.allowedOperators = ['=', '>', '<', '>=', '<=', 'LIKE', 'IN', 'BETWEEN'];
    }

    /**
     * Constrói WHERE clause baseado em filtros - CORRIGIDO
     * @param {Object} filters - Objeto com filtros
     * @returns {Object} {where: string, params: array}
     */
    buildWhereClause(filters) {
        const conditions = [];
        const params = [];

        // Filtro de período customizado
        if (filters.startDate && filters.endDate) {
            conditions.push('created_at BETWEEN ? AND ?');
            params.push(filters.startDate, filters.endDate);
        } 
        // Filtro de período predefinido
        else if (filters.period) {
            const periodClause = this.buildPeriodClause(filters.period);
            if (periodClause) {
                conditions.push(periodClause);
            }
        }

        // Filtro de canais (múltipla seleção) - CORRIGIDO
        if (filters.channelIds) {
            const channelArray = Array.isArray(filters.channelIds) 
                ? filters.channelIds 
                : filters.channelIds.toString().split(',').map(id => parseInt(id.trim()));
            
            if (channelArray.length > 0 && channelArray[0] !== '') {
                const placeholders = channelArray.map(() => '?').join(',');
                conditions.push(`channel_id IN (${placeholders})`);
                params.push(...channelArray);
            }
        }

        // Filtro de lojas (múltipla seleção) - CORRIGIDO
        if (filters.storeIds) {
            const storeArray = Array.isArray(filters.storeIds)
                ? filters.storeIds
                : filters.storeIds.toString().split(',').map(id => parseInt(id.trim()));
            
            if (storeArray.length > 0 && storeArray[0] !== '') {
                const placeholders = storeArray.map(() => '?').join(',');
                conditions.push(`store_id IN (${placeholders})`);
                params.push(...storeArray);
            }
        }

        // Filtro de status - CORRIGIDO
        if (filters.status) {
            const statusArray = Array.isArray(filters.status)
                ? filters.status
                : filters.status.toString().split(',');
            
            if (statusArray.length > 0 && statusArray[0] !== '') {
                const placeholders = statusArray.map(() => '?').join(',');
                conditions.push(`sale_status_desc IN (${placeholders})`);
                params.push(...statusArray);
            }
        }

        // Filtro de categoria (produtos)
        if (filters.categoryId) {
            conditions.push('category_id = ?');
            params.push(parseInt(filters.categoryId));
        }

        // Filtro de valor mínimo
        if (filters.minAmount) {
            conditions.push('total_amount >= ?');
            params.push(parseFloat(filters.minAmount));
        }

        // Filtro de valor máximo
        if (filters.maxAmount) {
            conditions.push('total_amount <= ?');
            params.push(parseFloat(filters.maxAmount));
        }

        // Filtro de cliente
        if (filters.customerId) {
            conditions.push('customer_id = ?');
            params.push(parseInt(filters.customerId));
        }

        // Busca textual (produtos, clientes) - Removido daqui, tratado separadamente
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        return { where: whereClause, params };
    }

    /**
     * Constrói cláusula de período predefinido
     * @param {string} period - 'last7days', 'last30days', etc
     * @returns {string} SQL condition
     */
    buildPeriodClause(period) {
        const periodMap = {
            'last7days': 'created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)',
            'last30days': 'created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)',
            'last90days': 'created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)',
            'thisMonth': 'YEAR(created_at) = YEAR(NOW()) AND MONTH(created_at) = MONTH(NOW())',
            'lastMonth': 'created_at >= DATE_SUB(DATE_SUB(NOW(), INTERVAL 1 MONTH), INTERVAL DAY(NOW())-1 DAY) AND created_at < DATE_SUB(NOW(), INTERVAL DAY(NOW())-1 DAY)',
            'thisYear': 'YEAR(created_at) = YEAR(NOW())',
            'lastYear': 'YEAR(created_at) = YEAR(NOW()) - 1'
        };

        return periodMap[period] || null;
    }

    /**
     * Constrói ORDER BY clause
     * @param {string} table - Nome da tabela
     * @param {string} sortBy - Campo de ordenação
     * @param {string} sortOrder - 'ASC' ou 'DESC'
     * @returns {string} ORDER BY clause
     */
    buildOrderClause(table, sortBy, sortOrder = 'DESC') {
        // Validação de segurança
        const allowedFields = this.allowedSortFields[table] || [];
        const field = allowedFields.includes(sortBy) ? sortBy : allowedFields[0] || 'id';
        const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        return `ORDER BY ${field} ${order}`;
    }

    /**
     * Constrói LIMIT clause com paginação
     * @param {number} page - Número da página (1-based)
     * @param {number} limit - Registros por página
     * @returns {Object} {limit: string, offset: number}
     */
    buildLimitClause(page = 1, limit = 50) {
        const maxLimit = 1000; // Segurança
        const safeLimit = Math.min(parseInt(limit) || 50, maxLimit);
        const safePage = Math.max(parseInt(page) || 1, 1);
        const offset = (safePage - 1) * safeLimit;

        return {
            limit: `LIMIT ${safeLimit} OFFSET ${offset}`,
            offset,
            safeLimit
        };
    }

    /**
     * Validação de filtros recebidos - MELHORADO
     * @param {Object} filters - Filtros a validar
     * @returns {Object} Filtros validados
     */
    validateFilters(filters) {
        const validated = {};

        // Validar datas
        if (filters.startDate) {
            const date = new Date(filters.startDate);
            if (!isNaN(date.getTime())) {
                validated.startDate = filters.startDate;
            }
        }

        if (filters.endDate) {
            const date = new Date(filters.endDate);
            if (!isNaN(date.getTime())) {
                validated.endDate = filters.endDate;
            }
        }

        // Validar período
        if (filters.period && typeof filters.period === 'string') {
            validated.period = filters.period;
        }

        // Validar arrays de IDs - CORRIGIDO
        if (filters.channelIds) {
            validated.channelIds = this.validateIdArray(filters.channelIds);
        }

        if (filters.storeIds) {
            validated.storeIds = this.validateIdArray(filters.storeIds);
        }

        // Validar status - CORRIGIDO
        if (filters.status) {
            if (Array.isArray(filters.status)) {
                validated.status = filters.status.filter(s => s !== '');
            } else if (typeof filters.status === 'string' && filters.status !== '') {
                validated.status = [filters.status];
            }
        }

        // Validar números
        if (filters.categoryId) {
            const id = parseInt(filters.categoryId);
            if (!isNaN(id)) validated.categoryId = id;
        }

        if (filters.customerId) {
            const id = parseInt(filters.customerId);
            if (!isNaN(id)) validated.customerId = id;
        }

        if (filters.minAmount) {
            const amount = parseFloat(filters.minAmount);
            if (!isNaN(amount)) validated.minAmount = amount;
        }

        if (filters.maxAmount) {
            const amount = parseFloat(filters.maxAmount);
            if (!isNaN(amount)) validated.maxAmount = amount;
        }

        // Validar busca
        if (filters.search && typeof filters.search === 'string') {
            validated.search = filters.search.substring(0, 100); // Limitar tamanho
            validated.searchField = filters.searchField || 'product';
        }

        return validated;
    }

    /**
     * Valida array de IDs - CORRIGIDO
     * @param {Array|string} ids - IDs a validar
     * @returns {Array} Array de IDs válidos
     */
    validateIdArray(ids) {
        if (!ids) return [];
        
        let idsArray;
        if (Array.isArray(ids)) {
            idsArray = ids;
        } else if (typeof ids === 'string') {
            idsArray = ids.split(',');
        } else {
            return [];
        }
        
        return idsArray
            .map(id => parseInt(id))
            .filter(id => !isNaN(id) && id > 0);
    }

    /**
     * Gera chave de cache baseada em filtros
     * @param {string} prefix - Prefixo da chave
     * @param {Object} filters - Filtros aplicados
     * @returns {string} Chave de cache
     */
    generateCacheKey(prefix, filters) {
        const sortedKeys = Object.keys(filters).sort();
        const keyParts = sortedKeys.map(key => {
            const value = filters[key];
            if (Array.isArray(value)) {
                return `${key}:${value.join(',')}`;
            }
            return `${key}:${value}`;
        });

        return `${prefix}:${keyParts.join('|')}`;
    }

    /**
     * Constrói query completa para vendas com filtros - CORRIGIDO
     * @param {Object} filters - Filtros validados
     * @param {Object} options - Opções de paginação e ordenação
     * @returns {Object} {sql, params}
     */
    buildSalesQuery(filters, options = {}) {
        const { where, params } = this.buildWhereClause(filters);
        const orderClause = this.buildOrderClause('sales', options.sortBy || 'created_at', options.sortOrder);
        const { limit } = this.buildLimitClause(options.page, options.limit);

        // Qualifica created_at com alias de tabela
        const qualifiedWhere = where.replace(/\bcreated_at\b/g, 's.created_at');

        const sql = `
            SELECT 
                s.*,
                c.customer_name,
                c.email,
                ch.name as channel_name,
                st.name as store_name,
                st.city as store_city
            FROM sales s
            LEFT JOIN customers c ON s.customer_id = c.id
            INNER JOIN channels ch ON s.channel_id = ch.id
            INNER JOIN stores st ON s.store_id = st.id
            ${qualifiedWhere}
            ${orderClause.replace('created_at', 's.created_at')}
            ${limit}
        `;

        return { sql, params };
    }

    /**
     * Constrói query de contagem para paginação
     * @param {string} table - Nome da tabela
     * @param {Object} filters - Filtros aplicados
     * @returns {Object} {sql, params}
     */
    buildCountQuery(table, filters) {
        const { where, params } = this.buildWhereClause(filters);

        const sql = `SELECT COUNT(*) as total FROM ${table} ${where}`;

        return { sql, params };
    }
}

export default new FilterService();