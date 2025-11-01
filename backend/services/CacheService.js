import logger from '../utils/logger.js';
import config from '../config/env.js';

export class CacheService {
    constructor() {
        this.cache = new Map();
        this.ttls = new Map();
        this.hits = 0;
        this.misses = 0;
        
        // Limpeza automática a cada 5 minutos
        this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
    }
    
    set(key, value, ttl = 300) {
        if (!config.cache.enabled) return;
        
        const expiresAt = Date.now() + (ttl * 1000);
        this.cache.set(key, value);
        this.ttls.set(key, expiresAt);
        
        logger.cache('SET', key);
    }
    
    get(key) {
        if (!config.cache.enabled) return null;
        
        if (!this.cache.has(key)) {
            this.misses++;
            logger.cache('MISS', key, false);
            return null;
        }
        
        const expiresAt = this.ttls.get(key);
        if (Date.now() > expiresAt) {
            this.delete(key);
            this.misses++;
            logger.cache('EXPIRED', key, false);
            return null;
        }
        
        this.hits++;
        logger.cache('HIT', key, true);
        return this.cache.get(key);
    }
    
    async getOrSet(key, fn, ttl = 300) {
        const cached = this.get(key);
        if (cached !== null) return cached;
        
        const result = await fn();
        this.set(key, result, ttl);
        return result;
    }
    
    delete(key) {
        this.cache.delete(key);
        this.ttls.delete(key);
    }
    
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];
        
        for (const [key, expiresAt] of this.ttls.entries()) {
            if (now > expiresAt) {
                keysToDelete.push(key);
            }
        }
        
        keysToDelete.forEach(key => this.delete(key));
        if (keysToDelete.length > 0) {
            logger.info(`Cache cleanup: ${keysToDelete.length} entradas removidas`);
        }
    }
    
    getStats() {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : 0;
        
        return {
            size: this.cache.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: `${hitRate}%`
        };
    }
}

export default new CacheService();