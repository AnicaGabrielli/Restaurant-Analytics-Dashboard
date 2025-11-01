// ========== backend/models/Item.js ==========
import { BaseModel } from './BaseModel.js';

export class Item extends BaseModel {
    constructor() {
        super('items');
    }

    async getTopItems(limit = 20) {
        const query = `
            SELECT 
                i.name as item_name,
                c.name as category_name,
                COUNT(ips.id) as times_added,
                SUM(ips.additional_price) as revenue_generated,
                AVG(ips.additional_price) as avg_price
            FROM ${this.tableName} i
            INNER JOIN item_product_sales ips ON i.id = ips.item_id
            INNER JOIN product_sales ps ON ips.product_sale_id = ps.id
            INNER JOIN sales s ON ps.sale_id = s.id
            LEFT JOIN categories c ON i.category_id = c.id
            WHERE s.sale_status_desc = 'COMPLETED'
            GROUP BY i.id, i.name, c.name
            ORDER BY times_added DESC
            LIMIT ${parseInt(limit)}
        `;

        return await this.query(query);
    }

    async getItemsByCategory() {
        const query = `
            SELECT 
                c.name as category_name,
                COUNT(DISTINCT i.id) as item_count,
                COUNT(ips.id) as times_used,
                SUM(ips.additional_price) as total_revenue
            FROM categories c
            LEFT JOIN ${this.tableName} i ON c.id = i.category_id
            LEFT JOIN item_product_sales ips ON i.id = ips.item_id
            LEFT JOIN product_sales ps ON ips.product_sale_id = ps.id
            LEFT JOIN sales s ON ps.sale_id = s.id AND s.sale_status_desc = 'COMPLETED'
            WHERE c.type = 'I'
            GROUP BY c.id, c.name
            ORDER BY total_revenue DESC
        `;

        return await this.query(query);
    }
}
