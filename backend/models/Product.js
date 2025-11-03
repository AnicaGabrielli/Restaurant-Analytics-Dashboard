import BaseModel from './BaseModel.js';

class Product extends BaseModel {
  static async getTopProducts(filters = {}, limit = 20) {
    const { clause, params } = this.buildWhereClause(filters);
    const limitClause = this.buildLimitClause(limit);
    
    const query = `
      SELECT 
        p.id,
        p.name as product_name,
        c.name as category_name,
        COUNT(ps.id) as times_sold,
        SUM(ps.quantity) as total_quantity,
        ${this.coalesce('SUM(ps.total_price)')} as total_revenue,
        ${this.coalesce('AVG(ps.total_price / NULLIF(ps.quantity, 0))')} as avg_price,
        0 as total_cost,
        ${this.coalesce('SUM(ps.total_price)')} as total_profit,
        100 as profit_margin_percent
      FROM products p
      JOIN product_sales ps ON ps.product_id = p.id
      JOIN sales s ON s.id = ps.sale_id
      LEFT JOIN categories c ON c.id = p.category_id
      ${clause}
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY p.id, p.name, c.name
      ORDER BY total_revenue DESC
      ${limitClause}
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  static async getLowMarginProducts(filters = {}, limit = 20) {
    const { clause, params } = this.buildWhereClause(filters);
    const limitClause = this.buildLimitClause(limit);
    
    // Retorna produtos com menor receita (simulando baixa margem)
    const query = `
      SELECT 
        p.id,
        p.name as product_name,
        c.name as category_name,
        COUNT(ps.id) as times_sold,
        SUM(ps.quantity) as total_quantity,
        ${this.coalesce('SUM(ps.total_price)')} as total_revenue,
        ${this.coalesce('AVG(ps.total_price / NULLIF(ps.quantity, 0))')} as avg_price,
        0 as total_cost,
        ${this.coalesce('SUM(ps.total_price)')} as total_profit,
        ROUND(${this.coalesce('AVG(ps.total_price / NULLIF(ps.quantity, 0))')} / 100 * 20, 2) as profit_margin_percent
      FROM products p
      JOIN product_sales ps ON ps.product_id = p.id
      JOIN sales s ON s.id = ps.sale_id
      LEFT JOIN categories c ON c.id = p.category_id
      ${clause}
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY p.id, p.name, c.name
      HAVING times_sold >= 5
      ORDER BY avg_price ASC
      ${limitClause}
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  static async getProductsByDayAndHour(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        p.name as product_name,
        DAYOFWEEK(s.created_at) as weekday,
        HOUR(s.created_at) as hour,
        COUNT(ps.id) as times_sold,
        SUM(ps.quantity) as total_quantity,
        ${this.coalesce('SUM(ps.total_price)')} as total_revenue
      FROM products p
      JOIN product_sales ps ON ps.product_id = p.id
      JOIN sales s ON s.id = ps.sale_id
      ${clause}
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY p.id, p.name, weekday, hour
      HAVING times_sold >= 3
      ORDER BY total_revenue DESC
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  static async getProductsByChannelAndDay(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        ch.id as channel_id,
        ch.name as channel_name,
        DAYOFWEEK(s.created_at) as weekday,
        HOUR(s.created_at) as hour,
        COUNT(ps.id) as times_sold,
        SUM(ps.quantity) as total_quantity,
        ${this.coalesce('SUM(ps.total_price)')} as total_revenue
      FROM products p
      JOIN product_sales ps ON ps.product_id = p.id
      JOIN sales s ON s.id = ps.sale_id
      JOIN channels ch ON ch.id = s.channel_id
      ${clause}
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY p.id, p.name, ch.id, ch.name, weekday, hour
      HAVING times_sold >= 2
      ORDER BY total_revenue DESC
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  static async getProductsByCategory(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        c.id as category_id,
        c.name as category_name,
        COUNT(DISTINCT p.id) as product_count,
        SUM(ps.quantity) as total_quantity,
        ${this.coalesce('SUM(ps.total_price)')} as total_revenue,
        0 as total_cost,
        ${this.coalesce('SUM(ps.total_price)')} as total_profit,
        100 as profit_margin_percent
      FROM categories c
      JOIN products p ON p.category_id = c.id
      JOIN product_sales ps ON ps.product_id = p.id
      JOIN sales s ON s.id = ps.sale_id
      ${clause}
      AND s.sale_status_desc = 'COMPLETED'
      AND c.type = 'P'
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  static async getTopCustomizations(filters = {}, limit = 20) {
    const { clause, params } = this.buildWhereClause(filters);
    const limitClause = this.buildLimitClause(limit);
    
    const query = `
      SELECT 
        i.id as item_id,
        i.name as item_name,
        COUNT(*) as times_added,
        ${this.coalesce('SUM(ips.additional_price)')} as revenue_generated,
        ${this.coalesce('AVG(ips.additional_price)')} as avg_price
      FROM item_product_sales ips
      JOIN items i ON i.id = ips.item_id
      JOIN product_sales ps ON ps.id = ips.product_sale_id
      JOIN sales s ON s.id = ps.sale_id
      ${clause}
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY i.id, i.name
      ORDER BY times_added DESC
      ${limitClause}
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }

  static async getProductPerformanceByChannel(filters = {}) {
    const { clause, params } = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        p.id as product_id,
        p.name as product_name,
        ch.id as channel_id,
        ch.name as channel_name,
        COUNT(ps.id) as times_sold,
        ${this.coalesce('SUM(ps.total_price)')} as revenue,
        ${this.coalesce('AVG(ps.total_price / NULLIF(ps.quantity, 0))')} as avg_price
      FROM products p
      JOIN product_sales ps ON ps.product_id = p.id
      JOIN sales s ON s.id = ps.sale_id
      JOIN channels ch ON ch.id = s.channel_id
      ${clause}
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY p.id, p.name, ch.id, ch.name
      ORDER BY revenue DESC
    `;
    
    const rows = await this.executeQuery(query, params);
    return this.formatResults(rows);
  }
}

export default Product;