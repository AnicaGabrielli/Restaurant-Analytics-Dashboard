import db from '../config/database.js';

class Performance {
  // Tempo de entrega por dia da semana e horário
  static async getDeliveryTimeByDayAndHour(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        DAYOFWEEK(s.created_at) as weekday,
        HOUR(s.created_at) as hour,
        COUNT(*) as delivery_count,
        AVG(s.delivery_seconds / 60.0) as avg_delivery_minutes,
        MIN(s.delivery_seconds / 60.0) as min_delivery_minutes,
        MAX(s.delivery_seconds / 60.0) as max_delivery_minutes
      FROM sales s
      ${whereConditions.clause}
      AND s.delivery_seconds IS NOT NULL
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY weekday, hour
      HAVING delivery_count >= 3
      ORDER BY weekday, hour
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Performance de entrega por região
  static async getDeliveryPerformanceByRegion(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        da.city,
        da.neighborhood,
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
      GROUP BY da.city, da.neighborhood
      HAVING delivery_count >= 5
      ORDER BY avg_delivery_minutes DESC
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Eficiência operacional por loja
  static async getStoreEfficiency(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        st.id as store_id,
        st.name as store_name,
        st.city,
        COUNT(s.id) as total_orders,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN s.sale_status_desc = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_orders,
        ROUND(SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN 1 ELSE 0 END) * 100.0 / COUNT(s.id), 2) as completion_rate,
        ROUND(SUM(CASE WHEN s.sale_status_desc = 'CANCELLED' THEN 1 ELSE 0 END) * 100.0 / COUNT(s.id), 2) as cancellation_rate,
        AVG(CASE WHEN s.delivery_seconds IS NOT NULL AND s.sale_status_desc = 'COMPLETED' THEN s.delivery_seconds / 60.0 ELSE NULL END) as avg_delivery_time,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE NULL END) as avg_ticket
      FROM stores st
      JOIN sales s ON s.store_id = st.id
      ${whereConditions.clause}
      GROUP BY st.id, st.name, st.city
      ORDER BY completion_rate DESC, total_revenue DESC
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Performance por canal de venda
  static async getChannelPerformance(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        ch.id as channel_id,
        ch.name as channel_name,
        COUNT(s.id) as total_orders,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN 1 ELSE 0 END) as completed_orders,
        ROUND(SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN 1 ELSE 0 END) * 100.0 / COUNT(s.id), 2) as completion_rate,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE NULL END) as avg_ticket,
        AVG(CASE WHEN s.delivery_seconds IS NOT NULL AND s.sale_status_desc = 'COMPLETED' THEN s.delivery_seconds / 60.0 ELSE NULL END) as avg_delivery_time
      FROM channels ch
      JOIN sales s ON s.channel_id = ch.id
      ${whereConditions.clause}
      GROUP BY ch.id, ch.name
      ORDER BY total_revenue DESC
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Horários de pico
  static async getPeakHours(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        HOUR(s.created_at) as hour,
        COUNT(*) as order_count,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE 0 END) as revenue,
        AVG(CASE WHEN s.delivery_seconds IS NOT NULL AND s.sale_status_desc = 'COMPLETED' THEN s.delivery_seconds / 60.0 ELSE NULL END) as avg_delivery_time,
        CASE
          WHEN COUNT(*) >= (SELECT AVG(hourly_count) * 1.5 FROM (
            SELECT HOUR(created_at) as h, COUNT(*) as hourly_count
            FROM sales
            ${whereConditions.clause}
            GROUP BY h
          ) as hourly_avg) THEN 'Alto'
          WHEN COUNT(*) >= (SELECT AVG(hourly_count) FROM (
            SELECT HOUR(created_at) as h, COUNT(*) as hourly_count
            FROM sales
            ${whereConditions.clause}
            GROUP BY h
          ) as hourly_avg) THEN 'Médio'
          ELSE 'Baixo'
        END as volume_category
      FROM sales s
      ${whereConditions.clause}
      GROUP BY hour
      ORDER BY hour
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Taxa de cancelamento por motivo
  static async getCancellationAnalysis(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        s.cancellation_reason,
        COUNT(*) as cancellation_count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sales WHERE sale_status_desc = 'CANCELLED' ${whereConditions.clause ? 'AND ' + whereConditions.clause.replace('WHERE', '') : ''}), 2) as percentage,
        AVG(s.total_amount) as avg_order_value
      FROM sales s
      ${whereConditions.clause}
      ${whereConditions.clause ? 'AND' : 'WHERE'} s.sale_status_desc = 'CANCELLED'
      AND s.cancellation_reason IS NOT NULL
      GROUP BY s.cancellation_reason
      ORDER BY cancellation_count DESC
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Comparativo de performance (ticket médio por loja e canal)
  static async getTicketComparison(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        'Loja' as type,
        st.name as name,
        AVG(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE NULL END) as avg_ticket,
        COUNT(s.id) as order_count
      FROM sales s
      JOIN stores st ON st.id = s.store_id
      ${whereConditions.clause}
      GROUP BY st.id, st.name
      UNION ALL
      SELECT 
        'Canal' as type,
        ch.name as name,
        AVG(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE NULL END) as avg_ticket,
        COUNT(s.id) as order_count
      FROM sales s
      JOIN channels ch ON ch.id = s.channel_id
      ${whereConditions.clause}
      GROUP BY ch.id, ch.name
      ORDER BY type, avg_ticket DESC
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Capacidade operacional (pedidos por hora por loja)
  static async getOperationalCapacity(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        st.name as store_name,
        HOUR(s.created_at) as hour,
        COUNT(*) as orders_per_hour,
        AVG(CASE WHEN s.delivery_seconds IS NOT NULL THEN s.delivery_seconds / 60.0 ELSE NULL END) as avg_delivery_time,
        CASE
          WHEN COUNT(*) >= 20 THEN 'Sobrecarga'
          WHEN COUNT(*) >= 10 THEN 'Alta'
          WHEN COUNT(*) >= 5 THEN 'Normal'
          ELSE 'Baixa'
        END as capacity_level
      FROM sales s
      JOIN stores st ON st.id = s.store_id
      ${whereConditions.clause}
      GROUP BY st.id, st.name, hour
      HAVING orders_per_hour > 0
      ORDER BY st.name, hour
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

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    return { clause, params };
  }
}

export default Performance;