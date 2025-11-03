import db from '../config/database.js';

class Sale {
  static async getMetrics(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        COUNT(*) as total_sales,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE NULL END) as avg_ticket,
        SUM(CASE WHEN s.sale_status_desc = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_sales,
        ROUND(SUM(CASE WHEN s.sale_status_desc = 'CANCELLED' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as cancellation_rate
      FROM sales s
      ${whereConditions.clause}
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows[0];
  }

  static async getSalesByPeriod(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    const groupBy = filters.groupBy || 'day';
    
    const dateFormat = {
      day: '%Y-%m-%d',
      week: '%Y-%u',
      month: '%Y-%m'
    }[groupBy];

    const query = `
      SELECT 
        DATE_FORMAT(s.created_at, '${dateFormat}') as period,
        COUNT(*) as sales_count,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE 0 END) as revenue,
        AVG(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE NULL END) as avg_ticket
      FROM sales s
      ${whereConditions.clause}
      GROUP BY period
      ORDER BY period
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  static async getSalesByChannel(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        c.name as channel_name,
        COUNT(s.id) as sales_count,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE 0 END) as revenue,
        AVG(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE NULL END) as avg_ticket,
        ROUND(SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN 1 ELSE 0 END) * 100.0 / COUNT(s.id), 2) as completion_rate
      FROM sales s
      JOIN channels c ON s.channel_id = c.id
      ${whereConditions.clause}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  static async getSalesByStore(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        st.name as store_name,
        st.city,
        COUNT(s.id) as sales_count,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE 0 END) as revenue,
        AVG(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE NULL END) as avg_ticket,
        ROUND(SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN 1 ELSE 0 END) * 100.0 / COUNT(s.id), 2) as completion_rate
      FROM sales s
      JOIN stores st ON s.store_id = st.id
      ${whereConditions.clause}
      GROUP BY st.id, st.name, st.city
      ORDER BY revenue DESC
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  static async getHourlyDistribution(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        HOUR(s.created_at) as hour,
        COUNT(*) as sales_count,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE 0 END) as revenue,
        AVG(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE NULL END) as avg_ticket
      FROM sales s
      ${whereConditions.clause}
      GROUP BY hour
      ORDER BY hour
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  static async getWeekdayDistribution(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        DAYOFWEEK(s.created_at) as weekday,
        COUNT(*) as sales_count,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE 0 END) as revenue,
        AVG(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE NULL END) as avg_ticket
      FROM sales s
      ${whereConditions.clause}
      GROUP BY weekday
      ORDER BY weekday
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  static async getDeliveryPerformance(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        da.neighborhood,
        da.city,
        COUNT(*) as delivery_count,
        AVG(s.delivery_seconds / 60.0) as avg_delivery_minutes,
        MIN(s.delivery_seconds / 60.0) as min_delivery_minutes,
        MAX(s.delivery_seconds / 60.0) as max_delivery_minutes,
        STDDEV(s.delivery_seconds / 60.0) as std_delivery_minutes
      FROM sales s
      JOIN delivery_addresses da ON da.sale_id = s.id
      ${whereConditions.clause}
      AND s.delivery_seconds IS NOT NULL
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY da.neighborhood, da.city
      HAVING delivery_count >= 5
      ORDER BY avg_delivery_minutes ASC
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

    if (filters.channelId) {
      conditions.push('s.channel_id = ?');
      params.push(filters.channelId);
    }

    if (filters.status) {
      conditions.push('s.sale_status_desc = ?');
      params.push(filters.status);
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    return { clause, params };
  }
}

export default Sale;