import db from '../config/database.js';

class Channel {
  static async getAll() {
    const query = `
      SELECT id, name, type, description
      FROM channels
      ORDER BY name
    `;
    
    const [rows] = await db.execute(query);
    return rows;
  }

  static async getById(id) {
    const query = `
      SELECT id, name, type, description
      FROM channels
      WHERE id = ?
    `;
    
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }

  static async getChannelPerformance(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        ch.id,
        ch.name as channel_name,
        ch.type,
        COUNT(s.id) as total_orders,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN s.sale_status_desc = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_orders,
        ROUND(SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN 1 ELSE 0 END) * 100.0 / COUNT(s.id), 2) as completion_rate,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE NULL END) as avg_ticket
      FROM channels ch
      LEFT JOIN sales s ON s.channel_id = ch.id
      ${whereConditions.clause}
      GROUP BY ch.id, ch.name, ch.type
      ORDER BY total_revenue DESC
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  static buildWhereClause(filters) {
    const conditions = [];
    const params = [];

    if (filters.startDate) {
      conditions.push('s.created_at >= ?');
      params.push(filters.startDate + ' 00:00:00');
    }

    if (filters.endDate) {
      conditions.push('s.created_at <= ?');
      params.push(filters.endDate + ' 23:59:59');
    }

    if (filters.storeId) {
      conditions.push('s.store_id = ?');
      params.push(filters.storeId);
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    return { clause, params };
  }
}

export default Channel;