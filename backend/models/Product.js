// ========== backend/models/Product.js - CORRIGIDO ==========
import { BaseModel } from './BaseModel.js';

export class Product extends BaseModel {
    constructor() {
        super('products');
    }

    async getTopSellingProducts(limit = 10, filters = {}) {
        // Ajusta WHERE para filtrar vendas, não produtos
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
                p.id,
                p.name as product_name,
                c.name as category_name,
                COUNT(ps.id) as times_sold,
                COALESCE(SUM(ps.quantity), 0) as total_quantity,
                COALESCE(SUM(ps.total_price), 0) as total_revenue,
                COALESCE(AVG(ps.base_price), 0) as avg_price
            FROM ${this.tableName} p
            INNER JOIN product_sales ps ON p.id = ps.product_id
            INNER JOIN sales s ON ps.sale_id = s.id
            LEFT JOIN categories c ON p.category_id = c.id
            ${whereClause}
            GROUP BY p.id, p.name, c.name
            ORDER BY total_revenue DESC
            LIMIT ?
        `;

        return await this.query(query, [...params, limit]);
    }

    async getProductsByCategory(filters = {}) {
        let whereClause = 'AND s.sale_status_desc = "COMPLETED"';
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
                c.name as category_name,
                COUNT(DISTINCT p.id) as product_count,
                COUNT(ps.id) as times_sold,
                COALESCE(SUM(ps.total_price), 0) as total_revenue
            FROM categories c
            LEFT JOIN ${this.tableName} p ON c.id = p.category_id
            LEFT JOIN product_sales ps ON p.id = ps.product_id
            LEFT JOIN sales s ON ps.sale_id = s.id
            WHERE c.type = 'P' ${whereClause}
            GROUP BY c.id, c.name
            HAVING total_revenue > 0
            ORDER BY total_revenue DESC
        `;

        return await this.query(query, params);
    }

    async getProductPerformance(productId) {
        const query = `
            SELECT 
                DATE_FORMAT(s.created_at, '%Y-%m-%d') as date,
                COUNT(ps.id) as times_sold,
                COALESCE(SUM(ps.quantity), 0) as quantity_sold,
                COALESCE(SUM(ps.total_price), 0) as revenue
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

    async getMostCustomizedProducts(limit = 10, filters = {}) {
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
                p.name as product_name,
                COUNT(DISTINCT ips.id) as customization_count,
                COUNT(DISTINCT ps.id) as times_sold,
                ROUND(COUNT(DISTINCT ips.id) * 100.0 / COUNT(DISTINCT ps.id), 2) as customization_rate
            FROM ${this.tableName} p
            INNER JOIN product_sales ps ON p.id = ps.product_id
            LEFT JOIN item_product_sales ips ON ps.id = ips.product_sale_id
            INNER JOIN sales s ON ps.sale_id = s.id
            ${whereClause}
            GROUP BY p.id, p.name
            HAVING customization_count > 0
            ORDER BY customization_rate DESC
            LIMIT ?
        `;

        return await this.query(query, [...params, limit]);
    }

    /**
     * NOVO: Produtos com baixo desempenho
     */
    async getLowPerformingProducts(limit = 10, filters = {}) {
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
                p.id,
                p.name as product_name,
                c.name as category_name,
                COUNT(ps.id) as times_sold,
                COALESCE(SUM(ps.total_price), 0) as total_revenue
            FROM ${this.tableName} p
            LEFT JOIN product_sales ps ON p.id = ps.product_id
            LEFT JOIN sales s ON ps.sale_id = s.id ${whereClause}
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.deleted_at IS NULL
            GROUP BY p.id, p.name, c.name
            HAVING times_sold < 5
            ORDER BY times_sold ASC, total_revenue ASC
            LIMIT ?
        `;

        return await this.query(query, [...params, limit]);
    }

    /**
     * NOVO: Busca produtos
     */
    async searchProducts(searchTerm, filters = {}, page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        const searchPattern = `%${searchTerm}%`;

        const query = `
            SELECT 
                p.id,
                p.name,
                c.name as category_name,
                COUNT(ps.id) as times_sold,
                COALESCE(SUM(ps.total_price), 0) as total_revenue
            FROM ${this.tableName} p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN product_sales ps ON p.id = ps.product_id
            LEFT JOIN sales s ON ps.sale_id = s.id AND s.sale_status_desc = 'COMPLETED'
            WHERE p.name LIKE ?
                AND p.deleted_at IS NULL
            GROUP BY p.id, p.name, c.name
            ORDER BY p.name
            LIMIT ? OFFSET ?
        `;

        return await this.query(query, [searchPattern, limit, offset]);
    }
}

export default Product;