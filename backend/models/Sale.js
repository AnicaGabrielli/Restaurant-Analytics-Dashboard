// ========== backend/models/Sale.js - CORRIGIDO ==========
import { BaseModel } from './BaseModel.js';
import filterService from '../services/FilterService.js';

export class Sale extends BaseModel {
    constructor() {
        super('sales');
    }

    async getTotalRevenue(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);
        
        const query = `
            SELECT 
                COALESCE(SUM(total_amount), 0) as total_revenue,
                COUNT(*) as total_sales,
                COALESCE(AVG(total_amount), 0) as avg_ticket
            FROM ${this.tableName}
            ${where || 'WHERE sale_status_desc = "COMPLETED"'}
        `;

        const results = await this.query(query, params);
        return results[0];
    }

    async getSalesByPeriod(period = 'day', limit = 30, filters = {}) {
        const dateFormat = {
            hour: '%Y-%m-%d %H:00:00',
            day: '%Y-%m-%d',
            week: '%Y-%u',
            month: '%Y-%m'
        }[period] || '%Y-%m-%d';

        const { where, params } = filterService.buildWhereClause(filters);
        const baseWhere = where || 'WHERE sale_status_desc = "COMPLETED"';

        let days = 30;
        if (filters.period === 'last7days') days = 7;
        if (filters.period === 'last90days') days = 90;

        // CORRIGIDO: LIMIT direto
        const query = `
            SELECT 
                DATE_FORMAT(created_at, ?) as period,
                COUNT(*) as total_sales,
                COALESCE(SUM(total_amount), 0) as revenue,
                COALESCE(AVG(total_amount), 0) as avg_ticket
            FROM ${this.tableName}
            ${baseWhere}
            AND created_at >= DATE_SUB(NOW(), INTERVAL ${parseInt(days)} DAY)
            GROUP BY period
            ORDER BY period DESC
            LIMIT ${parseInt(limit)}
        `;

        return await this.query(query, [dateFormat, ...params]);
    }

    async getSalesByChannel(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);
        const baseWhere = where ? where.replace('created_at', 's.created_at') : '';

        const query = `
            SELECT 
                c.name as channel_name,
                c.type as channel_type,
                COUNT(s.id) as total_sales,
                COALESCE(SUM(s.total_amount), 0) as revenue,
                COALESCE(AVG(s.total_amount), 0) as avg_ticket
            FROM ${this.tableName} s
            INNER JOIN channels c ON s.channel_id = c.id
            ${baseWhere || 'WHERE s.sale_status_desc = "COMPLETED"'}
            GROUP BY c.id, c.name, c.type
            ORDER BY revenue DESC
        `;

        return await this.query(query, params);
    }

    async getSalesByStore(limit = 10, filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);
        const baseWhere = where ? where.replace('created_at', 's.created_at') : '';

        // CORRIGIDO: LIMIT direto
        const query = `
            SELECT 
                st.name as store_name,
                st.city,
                COUNT(s.id) as total_sales,
                COALESCE(SUM(s.total_amount), 0) as revenue,
                COALESCE(AVG(s.total_amount), 0) as avg_ticket
            FROM ${this.tableName} s
            INNER JOIN stores st ON s.store_id = st.id
            ${baseWhere || 'WHERE s.sale_status_desc = "COMPLETED"'}
            GROUP BY st.id, st.name, st.city
            ORDER BY revenue DESC
            LIMIT ${parseInt(limit)}
        `;

        return await this.query(query, params);
    }

    async getSalesByHour(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);
        const baseWhere = where || 'WHERE sale_status_desc = "COMPLETED"';

        const query = `
            SELECT 
                HOUR(created_at) as hour,
                COUNT(*) as total_sales,
                COALESCE(SUM(total_amount), 0) as revenue,
                COALESCE(AVG(total_amount), 0) as avg_ticket
            FROM ${this.tableName}
            ${baseWhere}
            AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY hour
            ORDER BY hour
        `;

        return await this.query(query, params);
    }

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
                COALESCE(SUM(total_amount), 0) as revenue,
                COALESCE(AVG(total_amount), 0) as avg_ticket
            FROM ${this.tableName}
            ${baseWhere}
            AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
            GROUP BY weekday, weekday_name
            ORDER BY weekday
        `;

        return await this.query(query, params);
    }

    async getCancellationRate(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);

        const query = `
            SELECT 
                sale_status_desc,
                COUNT(*) as count,
                ROUND(COUNT(*) * 100.0 / (
                    SELECT COUNT(*) 
                    FROM ${this.tableName}
                    ${where}
                ), 2) as percentage
            FROM ${this.tableName}
            ${where}
            GROUP BY sale_status_desc
        `;

        return await this.query(query, [...params, ...params]);
    }

    async getAverageProductionTime(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);
        const baseWhere = where || 'WHERE sale_status_desc = "COMPLETED"';

        const query = `
            SELECT 
                COALESCE(AVG(production_seconds / 60), 0) as avg_production_minutes,
                COALESCE(MIN(production_seconds / 60), 0) as min_production_minutes,
                COALESCE(MAX(production_seconds / 60), 0) as max_production_minutes
            FROM ${this.tableName}
            ${baseWhere}
            AND production_seconds IS NOT NULL
        `;

        const results = await this.query(query, params);
        return results[0];
    }

    async getAverageDeliveryTime(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);
        const baseWhere = where || 'WHERE sale_status_desc = "COMPLETED"';

        const query = `
            SELECT 
                COALESCE(AVG(delivery_seconds / 60), 0) as avg_delivery_minutes,
                COALESCE(MIN(delivery_seconds / 60), 0) as min_delivery_minutes,
                COALESCE(MAX(delivery_seconds / 60), 0) as max_delivery_minutes
            FROM ${this.tableName}
            ${baseWhere}
            AND delivery_seconds IS NOT NULL
        `;

        const results = await this.query(query, params);
        return results[0];
    }

    async getFilteredSales(filters = {}, page = 1, limit = 50) {
        const { where, params } = filterService.buildWhereClause(filters);
        const offset = (page - 1) * limit;
        
        const baseWhere = where ? where.replace('created_at', 's.created_at') : '';

        // CORRIGIDO: LIMIT e OFFSET diretos
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
            ${baseWhere}
            ORDER BY s.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;

        return await this.query(query, params);
    }

    async searchSales(searchTerm, filters = {}, page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        const searchPattern = `%${searchTerm}%`;

        // CORRIGIDO: LIMIT e OFFSET diretos
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
                CAST(s.id AS CHAR) LIKE ? OR
                COALESCE(s.cod_sale1, '') LIKE ? OR
                COALESCE(s.cod_sale2, '') LIKE ? OR
                COALESCE(c.customer_name, '') LIKE ? OR
                COALESCE(c.email, '') LIKE ?
            )
            ORDER BY s.created_at DESC
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;

        return await this.query(query, [
            searchPattern, searchPattern, searchPattern,
            searchPattern, searchPattern
        ]);
    }

    async countFiltered(filters = {}) {
        const { where, params } = filterService.buildWhereClause(filters);
        
        const query = `SELECT COUNT(*) as total FROM ${this.tableName} ${where}`;

        const results = await this.query(query, params);
        return results[0].total;
    }
}

export default Sale;