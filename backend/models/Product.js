// ========== backend/models/Product.js ==========
import { BaseModel } from './BaseModel.js';

export class Product extends BaseModel {
    constructor() {
        super('products');
    }

    async getTopSellingProducts(limit = 10) {
        const query = `
            SELECT 
                p.id,
                p.name as product_name,
                c.name as category_name,
                COUNT(ps.id) as times_sold,
                SUM(ps.quantity) as total_quantity,
                SUM(ps.total_price) as total_revenue,
                AVG(ps.base_price) as avg_price
            FROM ${this.tableName} p
            INNER JOIN product_sales ps ON p.id = ps.product_id
            INNER JOIN sales s ON ps.sale_id = s.id
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE s.sale_status_desc = 'COMPLETED'
            GROUP BY p.id, p.name, c.name
            ORDER BY total_revenue DESC
            LIMIT ${parseInt(limit)}
        `;

        return await this.query(query);
    }

    async getProductsByCategory() {
        const query = `
            SELECT 
                c.name as category_name,
                COUNT(DISTINCT p.id) as product_count,
                COUNT(ps.id) as times_sold,
                SUM(ps.total_price) as total_revenue
            FROM categories c
            LEFT JOIN ${this.tableName} p ON c.id = p.category_id
            LEFT JOIN product_sales ps ON p.id = ps.product_id
            LEFT JOIN sales s ON ps.sale_id = s.id AND s.sale_status_desc = 'COMPLETED'
            WHERE c.type = 'P'
            GROUP BY c.id, c.name
            ORDER BY total_revenue DESC
        `;

        return await this.query(query);
    }

    async getProductPerformance(productId) {
        const query = `
            SELECT 
                DATE_FORMAT(s.created_at, '%Y-%m-%d') as date,
                COUNT(ps.id) as times_sold,
                SUM(ps.quantity) as quantity_sold,
                SUM(ps.total_price) as revenue
            FROM product_sales ps
            INNER JOIN sales s ON ps.sale_id = s.id
            WHERE ps.product_id = ?
                AND s.sale_status_desc = 'COMPLETED'
                AND s.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY date
            ORDER BY date
        `;

        return await this.query(query, [productId]);
    }

    async getMostCustomizedProducts(limit = 10) {
        const query = `
            SELECT 
                p.name as product_name,
                COUNT(DISTINCT ips.id) as customization_count,
                COUNT(DISTINCT ps.id) as times_sold,
                COUNT(DISTINCT ips.id) * 100.0 / COUNT(DISTINCT ps.id) as customization_rate
            FROM ${this.tableName} p
            INNER JOIN product_sales ps ON p.id = ps.product_id
            LEFT JOIN item_product_sales ips ON ps.id = ips.product_sale_id
            INNER JOIN sales s ON ps.sale_id = s.id
            WHERE s.sale_status_desc = 'COMPLETED'
            GROUP BY p.id, p.name
            HAVING COUNT(DISTINCT ips.id) > 0
            ORDER BY customization_rate DESC
            LIMIT ${parseInt(limit)}
        `;

        return await this.query(query);
    }
}
