// ========== backend/models/Delivery.js ==========
import { BaseModel } from './BaseModel.js';

export class Delivery extends BaseModel {
    constructor() {
        super('delivery_sales');
    }

    async getDeliveryPerformanceByRegion() {
        const query = `
            SELECT 
                da.city,
                da.neighborhood,
                COUNT(*) as total_deliveries,
                AVG(s.delivery_seconds / 60) as avg_delivery_minutes,
                MIN(s.delivery_seconds / 60) as min_delivery_minutes,
                MAX(s.delivery_seconds / 60) as max_delivery_minutes
            FROM sales s
            INNER JOIN delivery_addresses da ON s.id = da.sale_id
            WHERE s.sale_status_desc = 'COMPLETED'
                AND s.delivery_seconds IS NOT NULL
            GROUP BY da.city, da.neighborhood
            HAVING total_deliveries >= 5
            ORDER BY avg_delivery_minutes DESC
            LIMIT 20
        `;

        return await this.query(query);
    }

    async getDeliveryStats() {
        const query = `
            SELECT 
                COUNT(*) as total_deliveries,
                AVG(delivery_fee) as avg_delivery_fee,
                AVG(courier_fee) as avg_courier_fee,
                SUM(delivery_fee) as total_delivery_revenue
            FROM ${this.tableName}
        `;

        const results = await this.query(query);
        return results[0];
    }

   async getTopDeliveryNeighborhoods(limit = 10) {
    const query = `
        SELECT 
            da.city,
            da.neighborhood,
            COUNT(*) as delivery_count,
            SUM(s.total_amount) as total_revenue
        FROM delivery_addresses da
        INNER JOIN sales s ON da.sale_id = s.id
        WHERE s.sale_status_desc = 'COMPLETED'
        GROUP BY da.city, da.neighborhood
        ORDER BY delivery_count DESC
        LIMIT ${parseInt(limit)}
    `;

    return await this.query(query);
    }
}