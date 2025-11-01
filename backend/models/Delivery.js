// ========== backend/models/Delivery.js - CORRIGIDO ==========
import { BaseModel } from './BaseModel.js';

export class Delivery extends BaseModel {
    constructor() {
        super('delivery_sales');
    }

    async getDeliveryPerformanceByRegion(filters = {}) {
        let whereClause = 'WHERE s.sale_status_desc = "COMPLETED"';
        let params = [];

        if (filters.period === 'last7days') {
            whereClause += ' AND s.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        } else if (filters.period === 'last90days') {
            whereClause += ' AND s.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
        } else {
            whereClause += ' AND s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        }

        const query = `
            SELECT 
                da.city,
                da.neighborhood,
                COUNT(*) as total_deliveries,
                COALESCE(AVG(s.delivery_seconds / 60), 0) as avg_delivery_minutes,
                COALESCE(MIN(s.delivery_seconds / 60), 0) as min_delivery_minutes,
                COALESCE(MAX(s.delivery_seconds / 60), 0) as max_delivery_minutes
            FROM sales s
            INNER JOIN delivery_addresses da ON s.id = da.sale_id
            ${whereClause}
                AND s.delivery_seconds IS NOT NULL
            GROUP BY da.city, da.neighborhood
            HAVING total_deliveries >= 5
            ORDER BY avg_delivery_minutes DESC
            LIMIT 20
        `;

        return await this.query(query, params);
    }

    async getDeliveryStats(filters = {}) {
        let whereClause = 'WHERE s.sale_status_desc = "COMPLETED"';
        let params = [];

        if (filters.period === 'last7days') {
            whereClause += ' AND s.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        } else if (filters.period === 'last90days') {
            whereClause += ' AND s.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
        } else {
            whereClause += ' AND s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        }

        const query = `
            SELECT 
                COUNT(DISTINCT s.id) as total_deliveries,
                COALESCE(AVG(s.delivery_seconds / 60), 0) as avg_delivery_minutes,
                COALESCE(AVG(s.delivery_fee), 0) as avg_delivery_fee,
                COALESCE(AVG(ds.courier_fee), 0) as avg_courier_fee,
                COALESCE(SUM(s.delivery_fee), 0) as total_delivery_revenue
            FROM sales s
            LEFT JOIN ${this.tableName} ds ON s.id = ds.sale_id
            ${whereClause}
                AND s.delivery_seconds IS NOT NULL
        `;

        const results = await this.query(query, params);
        return results[0];
    }

    async getTopDeliveryNeighborhoods(limit = 10, filters = {}) {
        let whereClause = 'WHERE s.sale_status_desc = "COMPLETED"';
        let params = [];

        if (filters.period === 'last7days') {
            whereClause += ' AND s.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        } else if (filters.period === 'last90days') {
            whereClause += ' AND s.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
        } else {
            whereClause += ' AND s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        }

        const query = `
            SELECT 
                da.city,
                da.neighborhood,
                COUNT(*) as delivery_count,
                COALESCE(SUM(s.total_amount), 0) as total_revenue
            FROM delivery_addresses da
            INNER JOIN sales s ON da.sale_id = s.id
            ${whereClause}
            GROUP BY da.city, da.neighborhood
            ORDER BY delivery_count DESC
            LIMIT ?
        `;

        return await this.query(query, [...params, limit]);
    }

    /**
     * NOVO: Métricas de performance de entrega
     */
    async getPerformanceMetrics(filters = {}) {
        let whereClause = 'WHERE s.sale_status_desc = "COMPLETED"';
        let params = [];

        if (filters.period === 'last7days') {
            whereClause += ' AND s.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        } else if (filters.period === 'last90days') {
            whereClause += ' AND s.created_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)';
        } else {
            whereClause += ' AND s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';
        }

        const query = `
            SELECT 
                ds.courier_type,
                COUNT(*) as total_deliveries,
                COALESCE(AVG(s.delivery_seconds / 60), 0) as avg_delivery_minutes,
                COALESCE(AVG(s.delivery_fee), 0) as avg_delivery_fee,
                COALESCE(AVG(ds.courier_fee), 0) as avg_courier_fee
            FROM ${this.tableName} ds
            INNER JOIN sales s ON ds.sale_id = s.id
            ${whereClause}
                AND s.delivery_seconds IS NOT NULL
            GROUP BY ds.courier_type
            ORDER BY total_deliveries DESC
        `;

        return await this.query(query, params);
    }
}

export default Delivery;