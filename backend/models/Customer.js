// ========== backend/models/Customer.js - CORRIGIDO ==========
import { BaseModel } from './BaseModel.js';
export class Customer extends BaseModel {
    constructor() {
        super('customers');
    }

    async getCustomerRetention(filters = {}) {
        const { default: filterService } = await import('../services/FilterService.js');
        const { where, params } = filterService.buildWhereClause(filters, 's');

        const query = `
            SELECT 
                CASE 
                    WHEN purchase_count = 1 THEN '1 compra'
                    WHEN purchase_count BETWEEN 2 AND 3 THEN '2-3 compras'
                    WHEN purchase_count BETWEEN 4 AND 10 THEN '4-10 compras'
                    ELSE '10+ compras'
                END as segment,
                COUNT(*) as customer_count,
                COALESCE(SUM(total_spent), 0) as total_revenue,
                COALESCE(AVG(total_spent), 0) as avg_lifetime_value
            FROM (
                SELECT 
                    c.id,
                    COUNT(s.id) as purchase_count,
                    SUM(s.total_amount) as total_spent
                FROM ${this.tableName} c
                LEFT JOIN sales s ON c.id = s.customer_id ${where ? 'AND ' + where.replace('WHERE ', '') : ''}
                GROUP BY c.id
            ) customer_stats
            GROUP BY segment
            ORDER BY 
                CASE segment
                    WHEN '1 compra' THEN 1
                    WHEN '2-3 compras' THEN 2
                    WHEN '4-10 compras' THEN 3
                    ELSE 4
                END
        `;

        return await this.query(query, params);
    }

    async getTopCustomers(limit = 10, filters = {}) {
        const { default: filterService } = await import('../services/FilterService.js');
        const { where, params } = filterService.buildWhereClause(filters, 's');

        const query = `
            SELECT 
                c.customer_name,
                c.email,
                COUNT(s.id) as total_purchases,
                COALESCE(SUM(s.total_amount), 0) as total_spent,
                COALESCE(AVG(s.total_amount), 0) as avg_ticket,
                MAX(s.created_at) as last_purchase
            FROM ${this.tableName} c
            INNER JOIN sales s ON c.id = s.customer_id
            ${where}
            GROUP BY c.id, c.customer_name, c.email
            ORDER BY total_spent DESC
            LIMIT ?
        `;

        return await this.query(query, [...params, limit]);
    }

    async getNewVsReturning(filters = {}) {
        const { default: filterService } = await import('../services/FilterService.js');
        const { where, params } = filterService.buildWhereClause(filters, 's');

        const query = `
            SELECT 
                CASE WHEN purchase_count = 1 THEN 'Novos' ELSE 'Recorrentes' END as customer_type,
                COUNT(*) as count,
                COALESCE(SUM(total_spent), 0) as revenue
            FROM (
                SELECT 
                    c.id,
                    COUNT(s.id) as purchase_count,
                    SUM(s.total_amount) as total_spent
                FROM ${this.tableName} c
                LEFT JOIN sales s ON c.id = s.customer_id ${where ? 'AND ' + where.replace('WHERE ', '') : ''}
                GROUP BY c.id
            ) customer_stats
            GROUP BY customer_type
        `;

        return await this.query(query, params);
    }

    async getLifetimeValueAnalysis(filters = {}) {
        const { default: filterService } = await import('../services/FilterService.js');
        const { where, params } = filterService.buildWhereClause(filters, 's');

        const query = `
            SELECT 
                CASE 
                    WHEN total_spent < 100 THEN 'Baixo (< R$ 100)'
                    WHEN total_spent BETWEEN 100 AND 500 THEN 'Médio (R$ 100-500)'
                    WHEN total_spent BETWEEN 500 AND 1000 THEN 'Alto (R$ 500-1000)'
                    ELSE 'Premium (> R$ 1000)'
                END as ltv_segment,
                COUNT(*) as customer_count,
                COALESCE(AVG(total_spent), 0) as avg_ltv,
                COALESCE(SUM(total_spent), 0) as total_revenue
            FROM (
                SELECT 
                    c.id,
                    SUM(s.total_amount) as total_spent
                FROM ${this.tableName} c
                LEFT JOIN sales s ON c.id = s.customer_id ${where ? 'AND ' + where.replace('WHERE ', '') : ''}
                GROUP BY c.id
            ) customer_ltv
            GROUP BY ltv_segment
            ORDER BY avg_ltv DESC
        `;

        return await this.query(query, params);
    }

    async getChurnRiskCustomers(filters = {}) {
        const query = `
            SELECT 
                c.customer_name,
                c.email,
                COUNT(s.id) as total_purchases,
                COALESCE(SUM(s.total_amount), 0) as total_spent,
                MAX(s.created_at) as last_purchase,
                DATEDIFF(NOW(), MAX(s.created_at)) as days_since_last_purchase
            FROM ${this.tableName} c
            INNER JOIN sales s ON c.id = s.customer_id
            WHERE s.sale_status_desc = 'COMPLETED'
            GROUP BY c.id, c.customer_name, c.email
            HAVING 
                total_purchases >= 3
                AND days_since_last_purchase > 60
            ORDER BY total_spent DESC, days_since_last_purchase DESC
            LIMIT 10
        `;

        return await this.query(query);
    }

    async searchCustomers(searchTerm, filters = {}, page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        const searchPattern = `%${searchTerm}%`;

        const query = `
            SELECT 
                c.id,
                c.customer_name,
                c.email,
                COUNT(s.id) as total_purchases,
                COALESCE(SUM(s.total_amount), 0) as total_spent,
                COALESCE(AVG(s.total_amount), 0) as avg_ticket
            FROM ${this.tableName} c
            LEFT JOIN sales s ON c.id = s.customer_id AND s.sale_status_desc = 'COMPLETED'
            WHERE (
                c.customer_name LIKE ? OR
                COALESCE(c.email, '') LIKE ?
            )
            GROUP BY c.id, c.customer_name, c.email
            ORDER BY total_spent DESC
            LIMIT ? OFFSET ?
        `;

        return await this.query(query, [searchPattern, searchPattern, limit, offset]);
    }
}

export default Customer;