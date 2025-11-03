import BaseModel from './BaseModel.js';

class Sale extends BaseModel {
  /**
   * Busca métricas gerais de vendas
   */
  static async getMetrics(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        COUNT(*) as total_sales,
        ${this.coalesce('SUM(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE 0 END)')} as total_revenue,
        ${this.coalesce('AVG(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE NULL END)')} as avg_ticket,
        SUM(CASE WHEN s.sale_status_desc = "CANCELLED" THEN 1 ELSE 0 END) as cancelled_sales,
        ROUND(${this.coalesce('SUM(CASE WHEN s.sale_status_desc = "CANCELLED" THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)')}, 2) as cancellation_rate
      FROM sales s
      ${clause}
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows)[0];
  }

  /**
   * Vendas agrupadas por período
   */
  static async getSalesByPeriod(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    const dateFormat = this.getDateFormat(filters.groupBy);

    const query = `
      SELECT 
        DATE_FORMAT(s.created_at, '${dateFormat}') as period,
        COUNT(*) as sales_count,
        ${this.coalesce('SUM(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE 0 END)')} as revenue,
        ${this.coalesce('AVG(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE NULL END)')} as avg_ticket
      FROM sales s
      ${clause}
      GROUP BY period
      ORDER BY period
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  /**
   * Vendas por canal
   */
  static async getSalesByChannel(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        c.id as channel_id,
        c.name as channel_name,
        COUNT(s.id) as sales_count,
        ${this.coalesce('SUM(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE 0 END)')} as revenue,
        ${this.coalesce('AVG(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE NULL END)')} as avg_ticket,
        ROUND(${this.coalesce('SUM(CASE WHEN s.sale_status_desc = "COMPLETED" THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(s.id), 0)')}, 2) as completion_rate
      FROM sales s
      JOIN channels c ON s.channel_id = c.id
      ${clause}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  /**
   * Vendas por loja
   */
  static async getSalesByStore(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        st.id as store_id,
        st.name as store_name,
        st.city,
        COUNT(s.id) as sales_count,
        ${this.coalesce('SUM(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE 0 END)')} as revenue,
        ${this.coalesce('AVG(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE NULL END)')} as avg_ticket,
        ROUND(${this.coalesce('SUM(CASE WHEN s.sale_status_desc = "COMPLETED" THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(s.id), 0)')}, 2) as completion_rate
      FROM sales s
      JOIN stores st ON s.store_id = st.id
      ${clause}
      GROUP BY st.id, st.name, st.city
      ORDER BY revenue DESC
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  /**
   * Distribuição de vendas por horário
   */
  static async getHourlyDistribution(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        HOUR(s.created_at) as hour,
        COUNT(*) as sales_count,
        ${this.coalesce('SUM(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE 0 END)')} as revenue,
        ${this.coalesce('AVG(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE NULL END)')} as avg_ticket
      FROM sales s
      ${clause}
      GROUP BY hour
      ORDER BY hour
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  /**
   * Distribuição de vendas por dia da semana
   */
  static async getWeekdayDistribution(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        DAYOFWEEK(s.created_at) as weekday,
        COUNT(*) as sales_count,
        ${this.coalesce('SUM(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE 0 END)')} as revenue,
        ${this.coalesce('AVG(CASE WHEN s.sale_status_desc = "COMPLETED" THEN s.total_amount ELSE NULL END)')} as avg_ticket
      FROM sales s
      ${clause}
      GROUP BY weekday
      ORDER BY weekday
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  /**
   * Performance de entrega por região
   */
  static async getDeliveryPerformance(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        da.neighborhood,
        da.city,
        COUNT(*) as delivery_count,
        ${this.coalesce('AVG(s.delivery_seconds / 60.0)')} as avg_delivery_minutes,
        ${this.coalesce('MIN(s.delivery_seconds / 60.0)')} as min_delivery_minutes,
        ${this.coalesce('MAX(s.delivery_seconds / 60.0)')} as max_delivery_minutes,
        ${this.coalesce('STDDEV(s.delivery_seconds / 60.0)')} as std_delivery_minutes
      FROM sales s
      JOIN delivery_addresses da ON da.sale_id = s.id
      ${clause}
      AND s.delivery_seconds IS NOT NULL
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY da.neighborhood, da.city
      HAVING delivery_count >= 5
      ORDER BY avg_delivery_minutes ASC
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }
}

export default Sale;