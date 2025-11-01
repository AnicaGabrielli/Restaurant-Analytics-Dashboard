// ========== backend/models/Customer.js ==========
import { BaseModel } from './BaseModel.js';

export class Customer extends BaseModel {
    constructor() {
        super('customers');
    }

    async getCustomerRetention() {
        const query = `
            SELECT 
                CASE 
                    WHEN purchase_count = 1 THEN '1 compra'
                    WHEN purchase_count BETWEEN 2 AND 3 THEN '2-3 compras'
                    WHEN purchase_count BETWEEN 4 AND 10 THEN '4-10 compras'
                    ELSE '10+ compras'
                END as segment,
                COUNT(*) as customer_count,
                SUM(total_spent) as total_revenue,
                AVG(total_spent) as avg_lifetime_value
            FROM (
                SELECT 
                    c.id,
                    COUNT(s.id) as purchase_count,
                    SUM(s.total_amount) as total_spent
                FROM ${this.tableName} c
                LEFT JOIN sales s ON c.id = s.customer_id AND s.sale_status_desc = 'COMPLETED'
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

        return await this.query(query);
    }

    async getTopCustomers(limit = 10) {
    const query = `
        SELECT 
            c.customer_name,
            c.email,
            COUNT(s.id) as total_purchases,
            SUM(s.total_amount) as total_spent,
            AVG(s.total_amount) as avg_ticket,
            MAX(s.created_at) as last_purchase
        FROM ${this.tableName} c
        INNER JOIN sales s ON c.id = s.customer_id
        WHERE s.sale_status_desc = 'COMPLETED'
        GROUP BY c.id, c.customer_name, c.email
        ORDER BY total_spent DESC
        LIMIT ${parseInt(limit)}
    `;

    return await this.query(query);
}
    async getNewVsReturning() {
        const query = `
            SELECT 
                CASE WHEN purchase_count = 1 THEN 'Novos' ELSE 'Recorrentes' END as customer_type,
                COUNT(*) as count,
                SUM(total_spent) as revenue
            FROM (
                SELECT 
                    c.id,
                    COUNT(s.id) as purchase_count,
                    SUM(s.total_amount) as total_spent
                FROM ${this.tableName} c
                LEFT JOIN sales s ON c.id = s.customer_id AND s.sale_status_desc = 'COMPLETED'
                GROUP BY c.id
            ) customer_stats
            GROUP BY customer_type
        `;

        return await this.query(query);
    }
}
