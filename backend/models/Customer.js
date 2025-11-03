import db from '../config/database.js';

class Customer {
  // Análise RFM (Recency, Frequency, Monetary)
  static async getRFMAnalysis(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        s.customer_id,
        c.name as customer_name,
        c.email,
        c.phone,
        DATEDIFF(NOW(), MAX(s.created_at)) as recency_days,
        COUNT(DISTINCT s.id) as frequency,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE 0 END) as monetary_value,
        AVG(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE NULL END) as avg_order_value,
        MIN(s.created_at) as first_purchase,
        MAX(s.created_at) as last_purchase,
        CASE
          WHEN DATEDIFF(NOW(), MAX(s.created_at)) <= 30 AND COUNT(DISTINCT s.id) >= 5 THEN 'VIP'
          WHEN DATEDIFF(NOW(), MAX(s.created_at)) <= 30 AND COUNT(DISTINCT s.id) >= 3 THEN 'Leal'
          WHEN DATEDIFF(NOW(), MAX(s.created_at)) <= 60 AND COUNT(DISTINCT s.id) >= 2 THEN 'Promissor'
          WHEN DATEDIFF(NOW(), MAX(s.created_at)) > 90 AND COUNT(DISTINCT s.id) >= 3 THEN 'Em Risco'
          WHEN DATEDIFF(NOW(), MAX(s.created_at)) > 90 THEN 'Perdido'
          ELSE 'Novo'
        END as customer_segment
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
      ${whereConditions.clause}
      AND s.customer_id IS NOT NULL
      GROUP BY s.customer_id, c.name, c.email, c.phone
      HAVING frequency > 0
      ORDER BY monetary_value DESC
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Clientes em churn (compraram 3+ vezes mas não voltam há 30+ dias)
  static async getChurnRiskCustomers(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        s.customer_id,
        c.name as customer_name,
        c.email,
        c.phone,
        COUNT(DISTINCT s.id) as total_orders,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE 0 END) as total_spent,
        MAX(s.created_at) as last_order_date,
        DATEDIFF(NOW(), MAX(s.created_at)) as days_since_last_order,
        AVG(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE NULL END) as avg_order_value
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
      ${whereConditions.clause}
      AND s.customer_id IS NOT NULL
      GROUP BY s.customer_id, c.name, c.email, c.phone
      HAVING total_orders >= 3 AND days_since_last_order >= 30
      ORDER BY total_spent DESC, days_since_last_order DESC
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Lifetime Value por segmento
  static async getLTVBySegment(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        segment,
        COUNT(*) as customer_count,
        AVG(total_value) as avg_ltv,
        SUM(total_value) as total_revenue,
        AVG(order_count) as avg_orders,
        AVG(avg_ticket) as avg_ticket_value
      FROM (
        SELECT 
          s.customer_id,
          COUNT(DISTINCT s.id) as order_count,
          SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE 0 END) as total_value,
          AVG(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE NULL END) as avg_ticket,
          CASE
            WHEN DATEDIFF(NOW(), MAX(s.created_at)) <= 30 AND COUNT(DISTINCT s.id) >= 5 THEN 'VIP'
            WHEN DATEDIFF(NOW(), MAX(s.created_at)) <= 30 AND COUNT(DISTINCT s.id) >= 3 THEN 'Leal'
            WHEN DATEDIFF(NOW(), MAX(s.created_at)) <= 60 AND COUNT(DISTINCT s.id) >= 2 THEN 'Promissor'
            WHEN DATEDIFF(NOW(), MAX(s.created_at)) > 90 AND COUNT(DISTINCT s.id) >= 3 THEN 'Em Risco'
            WHEN DATEDIFF(NOW(), MAX(s.created_at)) > 90 THEN 'Perdido'
            ELSE 'Novo'
          END as segment
        FROM sales s
        ${whereConditions.clause}
        AND s.customer_id IS NOT NULL
        GROUP BY s.customer_id
      ) as customer_data
      GROUP BY segment
      ORDER BY avg_ltv DESC
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Top clientes por receita
  static async getTopCustomers(filters = {}, limit = 20) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        s.customer_id,
        c.name as customer_name,
        c.email,
        c.phone,
        COUNT(DISTINCT s.id) as total_orders,
        SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE NULL END) as avg_ticket,
        MAX(s.created_at) as last_order,
        DATEDIFF(NOW(), MAX(s.created_at)) as days_since_last_order
      FROM sales s
      LEFT JOIN customers c ON c.id = s.customer_id
      ${whereConditions.clause}
      AND s.customer_id IS NOT NULL
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY s.customer_id, c.name, c.email, c.phone
      ORDER BY total_revenue DESC
      LIMIT ${limit}
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Frequência de compra
  static async getPurchaseFrequency(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        frequency_range,
        COUNT(*) as customer_count,
        AVG(total_value) as avg_revenue
      FROM (
        SELECT 
          s.customer_id,
          COUNT(DISTINCT s.id) as order_count,
          SUM(CASE WHEN s.sale_status_desc = 'COMPLETED' THEN s.total_amount ELSE 0 END) as total_value,
          CASE
            WHEN COUNT(DISTINCT s.id) = 1 THEN '1 pedido'
            WHEN COUNT(DISTINCT s.id) BETWEEN 2 AND 3 THEN '2-3 pedidos'
            WHEN COUNT(DISTINCT s.id) BETWEEN 4 AND 6 THEN '4-6 pedidos'
            WHEN COUNT(DISTINCT s.id) BETWEEN 7 AND 10 THEN '7-10 pedidos'
            ELSE '11+ pedidos'
          END as frequency_range
        FROM sales s
        ${whereConditions.clause}
        AND s.customer_id IS NOT NULL
        GROUP BY s.customer_id
      ) as freq_data
      GROUP BY frequency_range
      ORDER BY 
        CASE frequency_range
          WHEN '1 pedido' THEN 1
          WHEN '2-3 pedidos' THEN 2
          WHEN '4-6 pedidos' THEN 3
          WHEN '7-10 pedidos' THEN 4
          ELSE 5
        END
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Novos clientes por período
  static async getNewCustomers(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    const groupBy = filters.groupBy || 'day';
    
    const dateFormat = {
      day: '%Y-%m-%d',
      week: '%Y-%u',
      month: '%Y-%m'
    }[groupBy];

    const query = `
      SELECT 
        DATE_FORMAT(first_purchase, '${dateFormat}') as period,
        COUNT(*) as new_customers
      FROM (
        SELECT 
          customer_id,
          MIN(created_at) as first_purchase
        FROM sales
        WHERE customer_id IS NOT NULL
        ${whereConditions.clause ? 'AND ' + whereConditions.clause.replace('WHERE', '') : ''}
        GROUP BY customer_id
      ) as first_purchases
      WHERE first_purchase IS NOT NULL
      GROUP BY period
      ORDER BY period
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Retenção de clientes
  static async getRetentionRate(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        retention_period,
        COUNT(*) as customer_count,
        AVG(order_count) as avg_orders
      FROM (
        SELECT 
          s.customer_id,
          COUNT(DISTINCT s.id) as order_count,
          CASE
            WHEN DATEDIFF(MAX(s.created_at), MIN(s.created_at)) < 30 THEN '< 30 dias'
            WHEN DATEDIFF(MAX(s.created_at), MIN(s.created_at)) BETWEEN 30 AND 90 THEN '30-90 dias'
            WHEN DATEDIFF(MAX(s.created_at), MIN(s.created_at)) BETWEEN 91 AND 180 THEN '91-180 dias'
            ELSE '180+ dias'
          END as retention_period
        FROM sales s
        ${whereConditions.clause}
        AND s.customer_id IS NOT NULL
        GROUP BY s.customer_id
        HAVING order_count > 1
      ) as retention_data
      GROUP BY retention_period
      ORDER BY 
        CASE retention_period
          WHEN '< 30 dias' THEN 1
          WHEN '30-90 dias' THEN 2
          WHEN '91-180 dias' THEN 3
          ELSE 4
        END
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

export default Customer;