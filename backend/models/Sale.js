
// ========== backend/models/Sale.js ==========
import { BaseModel } from './BaseModel.js';

export class Sale extends BaseModel {
    constructor() {
        super('sales');
    }

    async getTotalRevenue(startDate = null, endDate = null) {
        let query = `
            SELECT 
                SUM(total_amount) as total_revenue,
                COUNT(*) as total_sales,
                AVG(total_amount) as avg_ticket
            FROM ${this.tableName}
            WHERE sale_status_desc = 'COMPLETED'
        `;
        const params = [];

        if (startDate && endDate) {
            query += ` AND created_at BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        const results = await this.query(query, params);
        return results[0];
    }

    async getSalesByPeriod(period = 'day', limit = 30) {
        const dateFormat = {
            hour: '%Y-%m-%d %H:00:00',
            day: '%Y-%m-%d',
            week: '%Y-%u',
            month: '%Y-%m'
        }[period] || '%Y-%m-%d';

        const query = `
            SELECT 
                DATE_FORMAT(created_at, ?) as period,
                COUNT(*) as total_sales,
                SUM(total_amount) as revenue,
                AVG(total_amount) as avg_ticket
            FROM ${this.tableName}
            WHERE sale_status_desc = 'COMPLETED'
                AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY period
            ORDER BY period DESC
        `;

        return await this.query(query, [dateFormat, limit]);
    }

    async getSalesByChannel() {
        const query = `
            SELECT 
                c.name as channel_name,
                c.type as channel_type,
                COUNT(s.id) as total_sales,
                SUM(s.total_amount) as revenue,
                AVG(s.total_amount) as avg_ticket
            FROM ${this.tableName} s
            INNER JOIN channels c ON s.channel_id = c.id
            WHERE s.sale_status_desc = 'COMPLETED'
            GROUP BY c.id, c.name, c.type
            ORDER BY revenue DESC
        `;

        return await this.query(query);
    }

    async getSalesByStore(limit = 10) {
        const query = `
            SELECT 
                st.name as store_name,
                st.city,
                COUNT(s.id) as total_sales,
                SUM(s.total_amount) as revenue,
                AVG(s.total_amount) as avg_ticket
            FROM ${this.tableName} s
            INNER JOIN stores st ON s.store_id = st.id
            WHERE s.sale_status_desc = 'COMPLETED'
            GROUP BY st.id, st.name, st.city
            ORDER BY revenue DESC
            LIMIT ${parseInt(limit)}
        `;

        return await this.query(query);
    }

    async getSalesByHour() {
        const query = `
            SELECT 
                HOUR(created_at) as hour,
                COUNT(*) as total_sales,
                SUM(total_amount) as revenue,
                AVG(total_amount) as avg_ticket
            FROM ${this.tableName}
            WHERE sale_status_desc = 'COMPLETED'
                AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY hour
            ORDER BY hour
        `;

        return await this.query(query);
    }

    async getSalesByWeekday() {
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
            WHERE sale_status_desc = 'COMPLETED'
                AND created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
            GROUP BY weekday, weekday_name
            ORDER BY weekday
        `;

        return await this.query(query);
    }

    async getCancellationRate() {
        const query = `
            SELECT 
                sale_status_desc,
                COUNT(*) as count,
                COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ${this.tableName}) as percentage
            FROM ${this.tableName}
            GROUP BY sale_status_desc
        `;

        return await this.query(query);
    }

    async getAverageProductionTime() {
        const query = `
            SELECT 
                AVG(production_seconds / 60) as avg_production_minutes,
                MIN(production_seconds / 60) as min_production_minutes,
                MAX(production_seconds / 60) as max_production_minutes
            FROM ${this.tableName}
            WHERE production_seconds IS NOT NULL
                AND sale_status_desc = 'COMPLETED'
        `;

        const results = await this.query(query);
        return results[0];
    }

    async getAverageDeliveryTime() {
        const query = `
            SELECT 
                AVG(delivery_seconds / 60) as avg_delivery_minutes,
                MIN(delivery_seconds / 60) as min_delivery_minutes,
                MAX(delivery_seconds / 60) as max_delivery_minutes
            FROM ${this.tableName}
            WHERE delivery_seconds IS NOT NULL
                AND sale_status_desc = 'COMPLETED'
        `;

        const results = await this.query(query);
        return results[0];
    }
}

