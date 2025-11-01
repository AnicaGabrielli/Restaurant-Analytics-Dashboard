// ========== backend/config/database.js ==========
import mysql from 'mysql2/promise';

class Database {
    constructor() {
        this.pool = null;
    }

    async connect() {
        if (!this.pool) {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '123456',
                database: process.env.DB_NAME || 'challenge_db',
                port: process.env.DB_PORT || 3306,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
                timezone: '+00:00'
            });
        }
        return this.pool;
    }

    async query(sql, params = []) {
        const connection = await this.connect();
        try {
            const [results] = await connection.execute(sql, params);
            return results;
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
}

export default new Database();
