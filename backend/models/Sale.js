// ========== backend/models/Sale.js ==========
import { BaseModel } from './BaseModel.js';
import filterService from '../services/FilterService.js';

export class Sale extends BaseModel {
    constructor() {
        super('sales');
    }

    /**
     * Total de receita com filtros
     */
    async getTotalRevenue(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);
        
        const query = `
            SELECT 
                SUM(total_amount) as total_revenue,
                COUNT(*) as total_sales,
                AVG(total_amount) as avg_ticket
            FROM ${this.tableName}
            ${where || 'WHERE sale_status_desc = "COMPLETED"'}
            ${where ? 'AND sale_status_desc = "COMPLETED"' : ''}
        `;

        const results = await this.query(query, params);
        return results[0];
    }

    /**
     * Vendas por período com filtros
     */
    async getSalesByPeriod(period = 'day', limit = 30, filters = {}) {
        const dateFormat = {
            hour: '%Y-%m-%d %H:00:00',
            day: '%Y-%m-%d',
            week: '%Y-%u',
            month: '%Y-%m'
        }[period] || '%Y-%m-%d';

        const { where, params } = filterService.buildWhereClause(filters);
        const baseWhere = where || 'WHERE sale_status_desc = "COMPLETED"';

        const query = `
            SELECT 
                DATE_FORMAT(created_at, ?) as period,
                COUNT(*) as total_sales,
                SUM(total_amount) as revenue,
                AVG(total_amount) as avg_ticket
            FROM ${this.tableName}
            ${baseWhere}
            ${where ? 'AND sale_status_desc = "COMPLETED"' : ''}
            AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY period
            ORDER BY period DESC
            LIMIT ?
        `;

        return await this.query(query, [dateFormat, ...params, limit, limit]);
    }

    /**
     * Vendas por canal com filtros
     */
    async getSalesByChannel(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);
        const baseWhere = where || 'WHERE s.sale_status_desc = "COMPLETED"';

        const query = `
            SELECT 
                c.name as channel_name,
                c.type as channel_type,
                COUNT(s.id) as total_sales,
                SUM(s.total_amount) as revenue,
                AVG(s.total_amount) as avg_ticket
            FROM ${this.tableName} s
            INNER JOIN channels c ON s.channel_id = c.id
            ${baseWhere.replace('WHERE', 'WHERE')}
            ${where ? 'AND s.sale_status_desc = "COMPLETED"' : ''}
            GROUP BY c.id, c.name, c.type
            ORDER BY revenue DESC
        `;

        return await this.query(query, params);
    }

    /**
     * Vendas por loja com filtros
     */
    async getSalesByStore(limit = 10, filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);
        const baseWhere = where || 'WHERE s.sale_status_desc = "COMPLETED"';

        const query = `
            SELECT 
                st.name as store_name,
                st.city,
                COUNT(s.id) as total_sales,
                SUM(s.total_amount) as revenue,
                AVG(s.total_amount) as avg_ticket
            FROM ${this.tableName} s
            INNER JOIN stores st ON s.store_id = st.id
            ${baseWhere.replace('WHERE', 'WHERE')}
            ${where ? 'AND s.sale_status_desc = "COMPLETED"' : ''}
            GROUP BY st.id, st.name, st.city
            ORDER BY revenue DESC
            LIMIT ?
        `;

        return await this.query(query, [...params, limit]);
    }

    /**
     * Vendas por hora do dia
     */
    async getSalesByHour(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);
        const baseWhere = where || 'WHERE sale_status_desc = "COMPLETED"';

        const query = `
            SELECT 
                HOUR(created_at) as hour,
                COUNT(*) as total_sales,
                SUM(total_amount) as revenue,
                AVG(total_amount) as avg_ticket
            FROM ${this.tableName}
            ${baseWhere}
            ${where ? 'AND sale_status_desc = "COMPLETED"' : ''}
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY hour
            ORDER BY hour
        `;

        return await this.query(query, params);
    }

    /**
     * Vendas por dia da semana
     */
    async getSalesByWeekday(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);
        const baseWhere = where || 'WHERE sale_status_desc = "COMPLETED"';

        const query = `
            SELECT 
                DAYOFWEEK(created_at) as weekday,
                CASE DAYOFWEEK(created_at)
                    WHEN 1 THEN 'Domingo'
                    WHEN 2 THEN 'Segunda'
                    WHEN 3 THEN 'Terça'
                    WHEN 4 THEN 'Quarta'
                    WHEN 5 THEN 'Quinta'
                    WHEN 6 THEN 'Sexta'
                    WHEN 7 THEN 'Sábado'
                END as weekday_name,
                COUNT(*) as total_sales,
                SUM(total_amount) as revenue,
                AVG(total_amount) as avg_ticket
            FROM ${this.tableName}
            ${baseWhere}
            ${where ? 'AND sale_status_desc = "COMPLETED"' : ''}
            AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
            GROUP BY weekday, weekday_name
            ORDER BY weekday
        `;

        return await this.query(query, params);
    }

    /**
     * Taxa de cancelamento
     */
    async getCancellationRate(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);

        const query = `
            SELECT 
                sale_status_desc,
                COUNT(*) as count,
                COUNT(*) * 100.0 / (
                    SELECT COUNT(*) 
                    FROM ${this.tableName}
                    ${where}
                ) as percentage
            FROM ${this.tableName}
            ${where}
            GROUP BY sale_status_desc
        `;

        return await this.query(query, params);
    }

    /**
     * Tempo médio de produção
     */
    async getAverageProductionTime(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);
        const baseWhere = where || 'WHERE sale_status_desc = "COMPLETED"';

        const query = `
            SELECT 
                AVG(production_seconds / 60) as avg_production_minutes,
                MIN(production_seconds / 60) as min_production_minutes,
                MAX(production_seconds / 60) as max_production_minutes
            FROM ${this.tableName}
            ${baseWhere}
            ${where ? 'AND sale_status_desc = "COMPLETED"' : ''}
            AND production_seconds IS NOT NULL
        `;

        const results = await this.query(query, params);
        return results[0];
    }

    /**
     * Tempo médio de entrega
     */
    async getAverageDeliveryTime(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);
        const baseWhere = where || 'WHERE sale_status_desc = "COMPLETED"';

        const query = `
            SELECT 
                AVG(delivery_seconds / 60) as avg_delivery_minutes,
                MIN(delivery_seconds / 60) as min_delivery_minutes,
                MAX(delivery_seconds / 60) as max_delivery_minutes
            FROM ${this.tableName}
            ${baseWhere}
            ${where ? 'AND sale_status_desc = "COMPLETED"' : ''}
            AND delivery_seconds IS NOT NULL
        `;

        const results = await this.query(query, params);
        return results[0];
    }

    /**
     * Busca vendas com filtros e paginação
     */
    async getFilteredSales(filters = {}, page = 1, limit = 50) {
        const { sql, params } = filterService.buildSalesQuery(filters, {
            sortBy: 'created_at',
            sortOrder: 'DESC',
            page,
            limit
        });

        return await this.query(sql, params);
    }

    /**
     * Busca textual em vendas
     */
    async searchSales(searchTerm, filters = {}, page = 1, limit = 50) {
        const { where, params } = filterService.buildWhereClause({
            ...filters,
            search: searchTerm,
            searchField: 'sale'
        });

        const { limit: limitClause } = filterService.buildLimitClause(page, limit);

        const query = `
            SELECT 
                s.*,
                c.customer_name,
                c.email,
                ch.name as channel_name,
                st.name as store_name
            FROM ${this.tableName} s
            LEFT JOIN customers c ON s.customer_id = c.id
            INNER JOIN channels ch ON s.channel_id = ch.id
            INNER JOIN stores st ON s.store_id = st.id
            WHERE (
                s.id LIKE ? OR
                s.cod_sale1 LIKE ? OR
                s.cod_sale2 LIKE ? OR
                c.customer_name LIKE ? OR
                c.email LIKE ?
            )
            ${where ? `AND ${where.replace('WHERE', '')}` : ''}
            ORDER BY s.created_at DESC
            ${limitClause}
        `;

        const searchPattern = `%${searchTerm}%`;
        return await this.query(query, [
            searchPattern, searchPattern, searchPattern,
            searchPattern, searchPattern,
            ...params
        ]);
    }

    /**
     * Contagem total de vendas com filtros
     */
    async countFiltered(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);
        
        const query = `
            SELECT COUNT(*) as total 
            FROM ${this.tableName}
            ${where}
        `;

        const results = await this.query(query, params);
        return results[0].total;
    }
}

export default Sale;