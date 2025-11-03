import db from '../config/database.js';

class Product {
  static async getTopProducts(filters = {}, limit = 20) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        p.id,
        p.name as product_name,
        c.name as category_name,
        COUNT(ps.id) as times_sold,
        SUM(ps.quantity) as total_quantity,
        SUM(ps.total_price) as total_revenue,
        AVG(ps.total_price / ps.quantity) as avg_price,
        SUM(ps.cost_price * ps.quantity) as total_cost,
        SUM(ps.total_price - (ps.cost_price * ps.quantity)) as total_profit,
        ROUND(((SUM(ps.total_price) - SUM(ps.cost_price * ps.quantity)) / SUM(ps.total_price)) * 100, 2) as profit_margin_percent
      FROM products p
      JOIN product_sales ps ON ps.product_id = p.id
      JOIN sales s ON s.id = ps.sale_id
      LEFT JOIN categories c ON c.id = p.category_id
      ${whereConditions.clause}
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY p.id, p.name, c.name
      ORDER BY total_revenue DESC
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Produtos com menor margem de lucro
  static async getLowMarginProducts(filters = {}, limit = 20) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        p.id,
        p.name as product_name,
        c.name as category_name,
        COUNT(ps.id) as times_sold,
        SUM(ps.quantity) as total_quantity,
        SUM(ps.total_price) as total_revenue,
        AVG(ps.total_price / ps.quantity) as avg_price,
        SUM(ps.cost_price * ps.quantity) as total_cost,
        SUM(ps.total_price - (ps.cost_price * ps.quantity)) as total_profit,
        ROUND(((SUM(ps.total_price) - SUM(ps.cost_price * ps.quantity)) / SUM(ps.total_price)) * 100, 2) as profit_margin_percent
      FROM products p
      JOIN product_sales ps ON ps.product_id = p.id
      JOIN sales s ON s.id = ps.sale_id
      LEFT JOIN categories c ON c.id = p.category_id
      ${whereConditions.clause}
      AND s.sale_status_desc = 'COMPLETED'
      AND ps.cost_price > 0
      GROUP BY p.id, p.name, c.name
      HAVING times_sold >= 5
      ORDER BY profit_margin_percent ASC
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Produtos por dia da semana e horário
  static async getProductsByDayAndHour(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        p.name as product_name,
        DAYOFWEEK(s.created_at) as weekday,
        HOUR(s.created_at) as hour,
        COUNT(ps.id) as times_sold,
        SUM(ps.quantity) as total_quantity,
        SUM(ps.total_price) as total_revenue
      FROM products p
      JOIN product_sales ps ON ps.product_id = p.id
      JOIN sales s ON s.id = ps.sale_id
      ${whereConditions.clause}
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY p.id, p.name, weekday, hour
      HAVING times_sold >= 3
      ORDER BY total_revenue DESC
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  // Produtos por canal e dia da semana
  static async getProductsByChannelAndDay(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        p.name as product_name,
        ch.name as channel_name,
        DAYOFWEEK(s.created_at) as weekday,
        HOUR(s.created_at) as hour,
        COUNT(ps.id) as times_sold,
        SUM(ps.quantity) as total_quantity,
        SUM(ps.total_price) as total_revenue
      FROM products p
      JOIN product_sales ps ON ps.product_id = p.id
      JOIN sales s ON s.id = ps.sale_id
      JOIN channels ch ON ch.id = s.channel_id
      ${whereConditions.clause}
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY p.id, p.name, ch.id, ch.name, weekday, hour
      HAVING times_sold >= 2
      ORDER BY total_revenue DESC
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  static async getProductsByCategory(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        c.name as category_name,
        COUNT(DISTINCT p.id) as product_count,
        SUM(ps.quantity) as total_quantity,
        SUM(ps.total_price) as total_revenue,
        SUM(ps.cost_price * ps.quantity) as total_cost,
        SUM(ps.total_price - (ps.cost_price * ps.quantity)) as total_profit,
        ROUND(((SUM(ps.total_price) - SUM(ps.cost_price * ps.quantity)) / SUM(ps.total_price)) * 100, 2) as profit_margin_percent
      FROM categories c
      JOIN products p ON p.category_id = c.id
      JOIN product_sales ps ON ps.product_id = p.id
      JOIN sales s ON s.id = ps.sale_id
      ${whereConditions.clause}
      AND s.sale_status_desc = 'COMPLETED'
      AND c.type = 'P'
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  static async getTopCustomizations(filters = {}, limit = 20) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        i.name as item_name,
        COUNT(*) as times_added,
        SUM(ips.additional_price) as revenue_generated,
        AVG(ips.additional_price) as avg_price
      FROM item_product_sales ips
      JOIN items i ON i.id = ips.item_id
      JOIN product_sales ps ON ps.id = ips.product_sale_id
      JOIN sales s ON s.id = ps.sale_id
      ${whereConditions.clause}
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY i.id, i.name
      ORDER BY times_added DESC
      ${limit ? `LIMIT ${limit}` : ''}
    `;
    
    const [rows] = await db.execute(query, whereConditions.params);
    return rows;
  }

  static async getProductPerformanceByChannel(filters = {}) {
    const whereConditions = this.buildWhereClause(filters);
    
    const query = `
      SELECT 
        p.name as product_name,
        ch.name as channel_name,
        COUNT(ps.id) as times_sold,
        SUM(ps.total_price) as revenue,
        AVG(ps.total_price / ps.quantity) as avg_price
      FROM products p
      JOIN product_sales ps ON ps.product_id = p.id
      JOIN sales s ON s.id = ps.sale_id
      JOIN channels ch ON ch.id = s.channel_id
      ${whereConditions.clause}
      AND s.sale_status_desc = 'COMPLETED'
      GROUP BY p.id, p.name, ch.id, ch.name
      ORDER BY revenue DESC
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

    if (filters.categoryId) {
      conditions.push('p.category_id = ?');
      params.push(filters.categoryId);
    }

    if (filters.weekday) {
      conditions.push('DAYOFWEEK(s.created_at) = ?');
      params.push(filters.weekday);
    }

    if (filters.hour) {
      conditions.push('HOUR(s.created_at) = ?');
      params.push(filters.hour);
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    return { clause, params };
  }
}

export default Product;