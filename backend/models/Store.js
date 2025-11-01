import db from '../config/database.js';

class Store {
  static async getAll() {
    const query = `
      SELECT id, name, city, state, is_active
      FROM stores
      WHERE is_active = true
      ORDER BY name
    `;
    
    const [rows] = await db.execute(query);
    return rows;
  }

  static async getChannels() {
    const query = `
      SELECT id, name, type, description
      FROM channels
      ORDER BY name
    `;
    
    const [rows] = await db.execute(query);
    return rows;
  }

  static async getCategories() {
    const query = `
      SELECT DISTINCT id, name, type
      FROM categories
      WHERE deleted_at IS NULL
      AND type = 'P'
      ORDER BY name
    `;
    
    const [rows] = await db.execute(query);
    return rows;
  }
}

export default Store;