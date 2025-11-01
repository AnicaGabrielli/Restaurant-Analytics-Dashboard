// ========== backend/models/BaseModel.js ==========
import database from '../config/database.js';

export class BaseModel {
    constructor(tableName) {
        this.tableName = tableName;
        this.db = database;
    }

    async findAll(limit = 100) {
        const query = `SELECT * FROM ${this.tableName} LIMIT ${parseInt(limit)}`;
        return await this.db.query(query, [limit]);
    }

    async findById(id) {
        const query = `SELECT * FROM ${this.tableName} WHERE id = ?`;
        const results = await this.db.query(query, [id]);
        return results[0] || null;
    }

    async count() {
        const query = `SELECT COUNT(*) as total FROM ${this.tableName}`;
        const results = await this.db.query(query);
        return results[0].total;
    }

    async query(sql, params = []) {
        return await this.db.query(sql, params);
    }
}