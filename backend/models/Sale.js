// ========== backend/models/Sale.js - COMPLETAMENTE CORRIGIDO ==========
import { BaseModel } from './BaseModel.js';
import filterService from '../services/FilterService.js';

export class Sale extends BaseModel {
    constructor() {
        super('sales');
    }

    /**
     * Total de receita com filtros aplicados
     */
    async getTotalRevenue(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters, 's');
        
        const query = `
            SELECT 
                COALESCE(SUM(s.total_amount), 0) as total_revenue,
                COUNT(*) as total_sales,
                COALESCE(AVG(s.total_amount), 0) as avg_ticket
            FROM ${this.tableName} s
            ${where}
        `;

        const results = await this.query(query, params);
        return results[0];
    }

    /**
     * Vendas por período (hora, dia, semana, mês)
     */
    async getSalesByPeriod(period = 'day', limit = 30, filters = {}) {
        const dateFormat = {
            hour: '%Y-%m-%d %H:00:00',
            day: '%Y-%m-%d',
            week: '%Y-%u',
            month: '%Y-%m'
        }[period] || '%Y-%m-%d';

        const { where, params } = filterService.buildWhereClause(filters, 's');

        let days = 30;
        if (filters.period === 'last7days') days = 7;
        if (filters.period === 'last90days') days = 90;

        const query = `
            SELECT 
                DATE_FORMAT(s.created_at, ?) as period,
                COUNT(*) as total_sales,
                COALESCE(SUM(s.total_amount), 0) as revenue,
                COALESCE(AVG(s.total_amount), 0) as avg_ticket
            FROM ${this.tableName} s
            ${where}
            ${where ? 'AND' : 'WHERE'} s.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY period
            ORDER BY period DESC
            LIMIT ?
        `;

        return await this.query(query, [dateFormat, ...params, days, limit]);
    }

    /**
     * Vendas por canal
     */
    async getSalesByChannel(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters, 's');

        const query = `
            SELECT 
                c.name as channel_name,
                c.type as channel_type,
                COUNT(s.id) as total_sales,
                COALESCE(SUM(s.total_amount), 0) as revenue,
                COALESCE(AVG(s.total_amount), 0) as avg_ticket
            FROM ${this.tableName} s
            INNER JOIN channels c ON s.channel_id = c.id
            ${where}
            GROUP BY c.id, c.name, c.type
            ORDER BY revenue DESC
        `;

        return await this.query(query, params);
    }

    /**
     * Vendas por loja
     */
    async getSalesByStore(limit = 10, filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters, 's');

        const query = `
            SELECT 
                st.name as store_name,
                st.city,
                COUNT(s.id) as total_sales,
                COALESCE(SUM(s.total_amount), 0) as revenue,
                COALESCE(AVG(s.total_amount), 0) as avg_ticket
            FROM ${this.tableName} s
            INNER JOIN stores st ON s.store_id = st.id
            ${where}
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
        const { where, params } = filterService.buildWhereClause(filters, 's');

        const query = `
            SELECT 
                HOUR(s.created_at) as hour,
                COUNT(*) as total_sales,
                COALESCE(SUM(s.total_amount), 0) as revenue,
                COALESCE(AVG(s.total_amount), 0) as avg_ticket
            FROM ${this.tableName} s
            ${where}
            ${where ? 'AND' : 'WHERE'} s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY hour
            ORDER BY hour
        `;

        return await this.query(query, params);
    }

    /**
     * Vendas por dia da semana
     */
    async getSalesByWeekday(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters, 's');

        const query = `
            SELECT 
                DAYOFWEEK(s.created_at) as weekday,
                CASE DAYOFWEEK(s.created_at)
                    WHEN 1 THEN 'Domingo'
                    WHEN 2 THEN 'Segunda'
                    WHEN 3 THEN 'Terça'
                    WHEN 4 THEN 'Quarta'
                    WHEN 5 THEN 'Quinta'
                    WHEN 6 THEN 'Sexta'
                    WHEN 7 THEN 'Sábado'
                END as weekday_name,
                COUNT(*) as total_sales,
                COALESCE(SUM(s.total_amount), 0) as revenue,
                COALESCE(AVG(s.total_amount), 0) as avg_ticket
            FROM ${this.tableName} s
            ${where}
            ${where ? 'AND' : 'WHERE'} s.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
            GROUP BY weekday, weekday_name
            ORDER BY weekday
        `;

        return await this.query(query, params);
    }

    /**
     * Taxa de cancelamento
     */
    async getCancellationRate(filters = {}) {
        // Remove filtro de status para ver todos
        const filtersWithoutStatus = { ...filters };
        delete filtersWithoutStatus.status;

        const { where, params } = filterService.buildWhereClause(filtersWithoutStatus, 's');

        const query = `
            SELECT 
                s.sale_status_desc,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (
                    SELECT COUNT(*) 
                    FROM ${this.tableName} s2
                    ${where.replace(/s\./g, 's2.')}
                ), 2) as percentage
            FROM ${this.tableName} s
            ${where}
            GROUP BY s.sale_status_desc
        `;

        return await this.query(query, [...params, ...params]);
    }

    /**
     * Tempo médio de produção
     */
    async getAverageProductionTime(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters, 's');

        const query = `
            SELECT 
                COALESCE(AVG(s.production_seconds / 60), 0) as avg_production_minutes,
                COALESCE(MIN(s.production_seconds / 60), 0) as min_production_minutes,
                COALESCE(MAX(s.production_seconds / 60), 0) as max_production_minutes
            FROM ${this.tableName} s
            ${where}
            ${where ? 'AND' : 'WHERE'} s.production_seconds IS NOT NULL
        `;

        const results = await this.query(query, params);
        return results[0];
    }

    /**
     * Tempo médio de entrega
     */
    async getAverageDeliveryTime(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters, 's');

        const query = `
            SELECT 
                COALESCE(AVG(s.delivery_seconds / 60), 0) as avg_delivery_minutes,
                COALESCE(MIN(s.delivery_seconds / 60), 0) as min_delivery_minutes,
                COALESCE(MAX(s.delivery_seconds / 60), 0) as max_delivery_minutes
            FROM ${this.tableName} s
            ${where}
            ${where ? 'AND' : 'WHERE'} s.delivery_seconds IS NOT NULL
        `;

        const results = await this.query(query, params);
        return results[0];
    }

    /**
     * Vendas filtradas com paginação - QUERY CORRIGIDA
     */
    async getFilteredSales(filters = {}, page = 1, limit = 50) {
        const { where, params } = filterService.buildWhereClause(filters, 's');
        const offset = (page - 1) * limit;

        const query = `
            SELECT 
                s.*,
                c.customer_name,
                c.email,
                ch.name as channel_name,
                st.name as store_name,
                st.city as store_city
            FROM ${this.tableName} s
            LEFT JOIN customers c ON s.customer_id = c.id
            INNER JOIN channels ch ON s.channel_id = ch.id
            INNER JOIN stores st ON s.store_id = st.id
            ${where}
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        `;

        return await this.query(query, [...params, limit, offset]);
    }

    /**
     * Busca vendas por termo
     */
    async searchSales(searchTerm, filters = {}, page = 1, limit = 50) {
        const { where, params } = filterService.buildWhereClause(filters, 's');
        const offset = (page - 1) * limit;
        const searchPattern = `%${searchTerm}%`;

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
            ${where}
            ${where ? 'AND' : 'WHERE'} (
                CAST(s.id AS CHAR) LIKE ? OR
                COALESCE(s.cod_sale1, '') LIKE ? OR
                COALESCE(s.cod_sale2, '') LIKE ? OR
                COALESCE(c.customer_name, '') LIKE ? OR
                COALESCE(c.email, '') LIKE ?
            )
            ORDER BY s.created_at DESC
            LIMIT ? OFFSET ?
        `;

        return await this.query(query, [
            ...params,
            searchPattern, searchPattern, searchPattern,
            searchPattern, searchPattern,
            limit, offset
        ]);
    }

    /**
     * Contagem de vendas filtradas
     */
    async countFiltered(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters, 's');
        
        const query = `SELECT COUNT(*) as total FROM ${this.tableName} s ${where}`;

        const results = await this.query(query, params);
        return results[0].total;
    }
}

export default Sale;