import BaseModel from './BaseModel.js';

class Customer extends BaseModel {
  static async getRFMAnalysis(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        s.customer_id,
        DATEDIFF(NOW(), MAX(s.created_at)) as recency_days,
        COUNT(DISTINCT s.id) as frequency,
        ${this.coalesce('SUM(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE 0 END)')} as monetary_value,
        ${this.coalesce('AVG(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE NULL END)')} as avg_order_value,
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
      ${clause}
      AND s.customer_id IS NOT NULL
      GROUP BY s.customer_id
      HAVING frequency > 0
      ORDER BY monetary_value DESC
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  static async getChurnRiskCustomers(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        s.customer_id,
        COUNT(DISTINCT s.id) as total_orders,
        ${this.coalesce('SUM(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE 0 END)')} as total_spent,
        MAX(s.created_at) as last_order_date,
        DATEDIFF(NOW(), MAX(s.created_at)) as days_since_last_order,
        ${this.coalesce('AVG(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE NULL END)')} as avg_order_value
      FROM sales s
      ${clause}
      AND s.customer_id IS NOT NULL
      GROUP BY s.customer_id
      HAVING total_orders >= 3 AND days_since_last_order >= 30
      ORDER BY total_spent DESC, days_since_last_order DESC
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  static async getLTVBySegment(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        segment,
        COUNT(*) as customer_count,
        ${this.coalesce('AVG(total_value)')} as avg_ltv,
        ${this.coalesce('SUM(total_value)')} as total_revenue,
        ${this.coalesce('AVG(order_count)')} as avg_orders,
        ${this.coalesce('AVG(avg_ticket)')} as avg_ticket_value
      FROM (
        SELECT 
          s.customer_id,
          COUNT(DISTINCT s.id) as order_count,
          ${this.coalesce('SUM(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE 0 END)')} as total_value,
          ${this.coalesce('AVG(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE NULL END)')} as avg_ticket,
          CASE
            WHEN DATEDIFF(NOW(), MAX(s.created_at)) <= 30 AND COUNT(DISTINCT s.id) >= 5 THEN 'VIP'
            WHEN DATEDIFF(NOW(), MAX(s.created_at)) <= 30 AND COUNT(DISTINCT s.id) >= 3 THEN 'Leal'
            WHEN DATEDIFF(NOW(), MAX(s.created_at)) <= 60 AND COUNT(DISTINCT s.id) >= 2 THEN 'Promissor'
            WHEN DATEDIFF(NOW(), MAX(s.created_at)) > 90 AND COUNT(DISTINCT s.id) >= 3 THEN 'Em Risco'
            WHEN DATEDIFF(NOW(), MAX(s.created_at)) > 90 THEN 'Perdido'
            ELSE 'Novo'
          END as segment
        FROM sales s
        ${clause}
        AND s.customer_id IS NOT NULL
        GROUP BY s.customer_id
      ) as customer_data
      GROUP BY segment
      ORDER BY avg_ltv DESC
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  static async getTopCustomers(filters = {}, limit = 20) {
    const { clause, params } = this.buildWhereClause(filters);
    const limitClause = this.buildLimitClause(limit);
    
    const query = `
      SELECT 
        s.customer_id,
        COUNT(DISTINCT s.id) as total_orders,
        ${this.coalesce('SUM(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE 0 END)')} as total_revenue,
        ${this.coalesce('AVG(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE NULL END)')} as avg_ticket,
        MAX(s.created_at) as last_order,
        DATEDIFF(NOW(), MAX(s.created_at)) as days_since_last_order
      FROM sales s
      ${clause}
      AND s.customer_id IS NOT NULL
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY s.customer_id
      ORDER BY total_revenue DESC
      ${limitClause}
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  static async getPurchaseFrequency(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        frequency_range,
        COUNT(*) as customer_count,
        ${this.coalesce('AVG(total_value)')} as avg_revenue
      FROM (
        SELECT 
          s.customer_id,
          COUNT(DISTINCT s.id) as order_count,
          ${this.coalesce('SUM(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE 0 END)')} as total_value,
          CASE
            WHEN COUNT(DISTINCT s.id) = 1 THEN '1 pedido'
            WHEN COUNT(DISTINCT s.id) BETWEEN 2 AND 3 THEN '2-3 pedidos'
            WHEN COUNT(DISTINCT s.id) BETWEEN 4 AND 6 THEN '4-6 pedidos'
            WHEN COUNT(DISTINCT s.id) BETWEEN 7 AND 10 THEN '7-10 pedidos'
            ELSE '11+ pedidos'
          END as frequency_range
        FROM sales s
        ${clause}
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
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  static async getNewCustomers(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    const dateFormat = this.getDateFormat(filters.groupBy);

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
        ${clause ? 'AND ' + clause.replace('WHERE', '') : ''}
        GROUP BY customer_id
      ) as first_purchases
      WHERE first_purchase IS NOT NULL
      GROUP BY period
      ORDER BY period
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  static async getRetentionRate(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        retention_period,
        COUNT(*) as customer_count,
        ${this.coalesce('AVG(order_count)')} as avg_orders
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
        ${clause}
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
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }
}

export default Customer;