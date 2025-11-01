// ========== backend/services/CacheService.js ==========
/**
 * Serviço de cache em memória com TTL
 * Reduz carga no banco em queries frequentes
 */

export class CacheService {
    constructor() {
        this.cache = new Map();
        this.ttls = new Map();
        this.hits = 0;
        this.misses = 0;

        // TTL padrão por tipo de dado (em segundos)
        this.defaultTTLs = {
            'dashboard': 300,        // 5 minutos
            'sales': 180,            // 3 minutos
            'products': 600,         // 10 minutos
            'customers': 600,        // 10 minutos
            'delivery': 300,         // 5 minutos
            'filters': 120,          // 2 minutos
            'search': 60,            // 1 minuto
            'export': 30             // 30 segundos
        };

        // Limpeza automática a cada 5 minutos
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 300000);
    }

    /**
     * Armazena valor no cache
     * @param {string} key - Chave única
     * @param {any} value - Valor a armazenar
     * @param {number} ttl - Tempo de vida em segundos (opcional)
     */
    set(key, value, ttl = null) {
        const cacheType = key.split(':')[0];
        const effectiveTTL = ttl || this.defaultTTLs[cacheType] || 300;
        const expiresAt = Date.now() + (effectiveTTL * 1000);

        this.cache.set(key, value);
        this.ttls.set(key, expiresAt);
    }

    /**
     * Recupera valor do cache
     * @param {string} key - Chave única
     * @returns {any|null} Valor armazenado ou null se expirado/inexistente
     */
    get(key) {
        if (!this.cache.has(key)) {
            this.misses++;
            return null;
        }

        const expiresAt = this.ttls.get(key);
        
        // Verifica se expirou
        if (expiresAt && Date.now() > expiresAt) {
            this.delete(key);
            this.misses++;
            return null;
        }

        this.hits++;
        return this.cache.get(key);
    }

    /**
     * Remove valor do cache
     * @param {string} key - Chave a remover
     */
    delete(key) {
        this.cache.delete(key);
        this.ttls.delete(key);
    }

    /**
     * Remove todos valores com determinado prefixo
     * @param {string} prefix - Prefixo das chaves
     */
    deleteByPrefix(prefix) {
        const keysToDelete = [];
        
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => this.delete(key));
    }

    /**
     * Invalida cache relacionado a vendas
     * Usado após inserções/atualizações
     */
    invalidateSales() {
        this.deleteByPrefix('dashboard');
        this.deleteByPrefix('sales');
        this.deleteByPrefix('filters');
    }

    /**
     * Invalida cache relacionado a produtos
     */
    invalidateProducts() {
        this.deleteByPrefix('products');
        this.deleteByPrefix('dashboard');
    }

    /**
     * Invalida cache relacionado a clientes
     */
    invalidateCustomers() {
        this.deleteByPrefix('customers');
        this.deleteByPrefix('dashboard');
    }

    /**
     * Invalida cache relacionado a entregas
     */
    invalidateDelivery() {
        this.deleteByPrefix('delivery');
        this.deleteByPrefix('dashboard');
    }

    /**
     * Limpa entradas expiradas
     */
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
            console.log(`[Cache] Limpeza: ${keysToDelete.length} entradas removidas`);
        }
    }

    /**
     * Limpa todo o cache
     */
    clear() {
        this.cache.clear();
        this.ttls.clear();
        this.hits = 0;
        this.misses = 0;
        console.log('[Cache] Cache completamente limpo');
    }

    /**
     * Retorna estatísticas do cache
     * @returns {Object} Estatísticas
     */
    getStats() {
        const total = this.hits + this.misses;
        const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(2) : 0;

        return {
            size: this.cache.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: `${hitRate}%`,
            totalRequests: total
        };
    }

    /**
     * Wrapper para executar função com cache
     * @param {string} key - Chave do cache
     * @param {Function} fn - Função a executar se não houver cache
     * @param {number} ttl - TTL opcional
     * @returns {Promise<any>} Resultado
     */
    async getOrSet(key, fn, ttl = null) {
        // Tenta pegar do cache
        const cached = this.get(key);
        if (cached !== null) {
            return cached;
        }

        // Executa função e armazena
        try {
            const result = await fn();
            this.set(key, result, ttl);
            return result;
        } catch (error) {
            console.error(`[Cache] Erro ao executar função para chave ${key}:`, error);
            throw error;
        }
    }

    /**
     * Pré-aquece cache com dados comuns
     * Executa queries que serão frequentemente acessadas
     */
    async warmup(analyticsService) {
        console.log('[Cache] Iniciando warmup...');

        try {
            // Dashboard overview
            await this.getOrSet(
                'dashboard:overview',
                () => analyticsService.getDashboardOverview(),
                this.defaultTTLs.dashboard
            );

            // Analytics principais
            await Promise.all([
                this.getOrSet('sales:analytics', () => analyticsService.getSalesAnalytics()),
                this.getOrSet('products:analytics', () => analyticsService.getProductAnalytics()),
                this.getOrSet('customers:analytics', () => analyticsService.getCustomerAnalytics()),
                this.getOrSet('delivery:analytics', () => analyticsService.getDeliveryAnalytics())
            ]);

            console.log('[Cache] Warmup concluído');
        } catch (error) {
            console.error('[Cache] Erro no warmup:', error);
        }
    }

    /**
     * Limpa cache periodicamente em produção
     * Previne memory leaks em servidores de longa duração
     */
    schedulePeriodicClear(intervalHours = 24) {
        const intervalMs = intervalHours * 60 * 60 * 1000;

        setInterval(() => {
            const stats = this.getStats();
            console.log('[Cache] Limpeza periódica:', stats);
            this.clear();
        }, intervalMs);
    }

    /**
     * Destroi o serviço de cache
     * Usado para testes ou shutdown gracioso
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.clear();
    }
}

export default new CacheService();