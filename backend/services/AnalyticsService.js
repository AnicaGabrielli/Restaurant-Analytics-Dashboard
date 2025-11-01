// ========== backend/services/AnalyticsService.js - COMPLETAMENTE CORRIGIDO ==========
import { Sale } from '../models/Sale.js';
import { Product } from '../models/Product.js';
import { Customer } from '../models/Customer.js';
import { Delivery } from '../models/Delivery.js';
import { Item } from '../models/Item.js';
import cacheService from './CacheService.js';
import filterService from './FilterService.js';
import logger from '../utils/logger.js';

export class AnalyticsService {
    constructor() {
        this.saleModel = new Sale();
        this.productModel = new Product();
        this.customerModel = new Customer();
        this.deliveryModel = new Delivery();
        this.itemModel = new Item();
    }

    /**
     * Dashboard Overview
     */
    async getDashboardOverview(filters = {}) {
        const cacheKey = filterService.generateCacheKey('dashboard', filters);
        
        return await cacheService.getOrSet(cacheKey, async () => {
            logger.info('[Dashboard] Carregando overview com filtros', filters);

            const [
                revenue,
                salesByPeriod,
                salesByChannel,
                topProducts,
                topItems,
                operationalMetrics,
                comparison
            ] = await Promise.all([
                this.saleModel.getTotalRevenue(filters),
                this.saleModel.getSalesByPeriod('day', 30, filters),
                this.saleModel.getSalesByChannel(filters),
                this.productModel.getTopSellingProducts(10, filters),
                this.itemModel.getTopItems(10),
                this.getOperationalMetrics(filters),
                this.getComparison(filters)
            ]);

            return {
                revenue,
                salesByPeriod,
                salesByChannel,
                topProducts,
                topItems,
                operationalMetrics,
                comparison
            };
        }, 300);
    }

    /**
     * Análise de Vendas
     */
    async getSalesAnalytics(filters = {}) {
        const cacheKey = filterService.generateCacheKey('sales', filters);
        
        return await cacheService.getOrSet(cacheKey, async () => {
            logger.info('[Sales Analytics] Carregando dados com filtros', filters);

            const [
                byHour,
                byWeekday,
                byStore,
                cancellationRate,
                productionTime,
                deliveryTime
            ] = await Promise.all([
                this.saleModel.getSalesByHour(filters),
                this.saleModel.getSalesByWeekday(filters),
                this.saleModel.getSalesByStore(10, filters),
                this.saleModel.getCancellationRate(filters),
                this.saleModel.getAverageProductionTime(filters),
                this.saleModel.getAverageDeliveryTime(filters)
            ]);

            return {
                byHour,
                byWeekday,
                byStore,
                cancellationRate,
                productionTime,
                deliveryTime
            };
        }, 180);
    }

    /**
     * Análise de Produtos
     */
    async getProductAnalytics(filters = {}) {
        const cacheKey = filterService.generateCacheKey('products', filters);
        
        return await cacheService.getOrSet(cacheKey, async () => {
            logger.info('[Product Analytics] Carregando dados com filtros', filters);

            const [
                topProducts,
                byCategory,
                mostCustomized,
                lowPerforming
            ] = await Promise.all([
                this.productModel.getTopSellingProducts(10, filters),
                this.productModel.getProductsByCategory(filters),
                this.productModel.getMostCustomizedProducts(10, filters),
                this.productModel.getLowPerformingProducts(10, filters)
            ]);

            return {
                topProducts,
                byCategory,
                mostCustomized,
                lowPerforming
            };
        }, 180);
    }

    /**
     * Análise de Clientes
     */
    async getCustomerAnalytics(filters = {}) {
        const cacheKey = filterService.generateCacheKey('customers', filters);
        
        return await cacheService.getOrSet(cacheKey, async () => {
            logger.info('[Customer Analytics] Carregando dados com filtros', filters);

            const [
                retention,
                topCustomers,
                newVsReturning,
                lifetimeValue,
                churnRisk
            ] = await Promise.all([
                this.customerModel.getCustomerRetention(filters),
                this.customerModel.getTopCustomers(15, filters),
                this.customerModel.getNewVsReturning(filters),
                this.customerModel.getLifetimeValueAnalysis(filters),
                this.customerModel.getChurnRiskCustomers(filters)
            ]);

            return {
                retention,
                topCustomers,
                newVsReturning,
                lifetimeValue,
                churnRisk
            };
        }, 180);
    }

    /**
     * Análise de Delivery
     */
    async getDeliveryAnalytics(filters = {}) {
        const cacheKey = filterService.generateCacheKey('delivery', filters);
        
        return await cacheService.getOrSet(cacheKey, async () => {
            logger.info('[Delivery Analytics] Carregando dados com filtros', filters);

            const [
                byRegion,
                stats,
                topNeighborhoods,
                performanceMetrics
            ] = await Promise.all([
                this.deliveryModel.getDeliveryPerformanceByRegion(filters),
                this.deliveryModel.getDeliveryStats(filters),
                this.deliveryModel.getTopDeliveryNeighborhoods(10, filters),
                this.deliveryModel.getPerformanceMetrics(filters)
            ]);

            return {
                byRegion,
                stats,
                topNeighborhoods,
                performanceMetrics
            };
        }, 180);
    }

    /**
     * Busca universal
     */
    async search(term, type, filters = {}, page = 1, limit = 50) {
        logger.info(`[Search] Termo: ${term}, Tipo: ${type}`, filters);

        const sanitizedTerm = filterService.sanitizeSearchTerm(term);

        switch (type) {
            case 'product':
                return await this.productModel.searchProducts(sanitizedTerm, filters, page, limit);
            case 'customer':
                return await this.customerModel.searchCustomers(sanitizedTerm, filters, page, limit);
            case 'sale':
                return await this.saleModel.searchSales(sanitizedTerm, filters, page, limit);
            default:
                throw new Error('Tipo de busca inválido');
        }
    }

    /**
     * Dados para exportação
     */
    async getExportData(type, filters = {}, limit = 10000) {
        logger.info(`[Export] Tipo: ${type}, Limite: ${limit}`, filters);

        switch (type) {
            case 'sales':
                return await this.saleModel.getFilteredSales(filters, 1, limit);
            case 'products':
                return await this.productModel.getTopSellingProducts(limit, filters);
            case 'customers':
                return await this.customerModel.getTopCustomers(limit, filters);
            case 'deliveries':
                return await this.deliveryModel.getTopDeliveryNeighborhoods(limit, filters);
            default:
                throw new Error('Tipo de exportação inválido');
        }
    }

    /**
     * Opções de filtros
     */
    async getFilterOptions() {
        return await cacheService.getOrSet('filter-options', async () => {
            const [stores, channels, categories] = await Promise.all([
                this.saleModel.query('SELECT id, name, city FROM stores WHERE is_active = true ORDER BY name'),
                this.saleModel.query('SELECT id, name, type FROM channels ORDER BY name'),
                this.productModel.query('SELECT DISTINCT id, name FROM categories WHERE type = "P" AND deleted_at IS NULL ORDER BY name')
            ]);

            return {
                stores,
                channels,
                categories,
                statuses: [
                    { value: 'COMPLETED', label: 'Completo' },
                    { value: 'CANCELLED', label: 'Cancelado' },
                    { value: 'ALL', label: 'Todos' }
                ],
                periods: [
                    { value: 'last7days', label: 'Últimos 7 dias' },
                    { value: 'last30days', label: 'Últimos 30 dias' },
                    { value: 'last90days', label: 'Últimos 90 dias' },
                    { value: 'thisMonth', label: 'Este mês' },
                    { value: 'lastMonth', label: 'Mês passado' },
                    { value: 'thisYear', label: 'Este ano' },
                    { value: 'custom', label: 'Personalizado' }
                ]
            };
        }, 3600);
    }

    /**
     * Métricas operacionais
     * @private
     */
    async getOperationalMetrics(filters = {}) {
        const [production, delivery] = await Promise.all([
            this.saleModel.getAverageProductionTime(filters),
            this.saleModel.getAverageDeliveryTime(filters)
        ]);

        return {
            production,
            delivery
        };
    }

    /**
     * Comparação com período anterior
     * @private
     */
    async getComparison(filters = {}) {
        try {
            const previousFilters = filterService.calculatePreviousPeriod(filters);
            
            const [current, previous] = await Promise.all([
                this.saleModel.getTotalRevenue(filters),
                this.saleModel.getTotalRevenue(previousFilters)
            ]);

            const revenueGrowth = previous.total_revenue > 0 
                ? ((current.total_revenue - previous.total_revenue) / previous.total_revenue) * 100 
                : 0;

            const salesGrowth = previous.total_sales > 0 
                ? ((current.total_sales - previous.total_sales) / previous.total_sales) * 100 
                : 0;

            return {
                current,
                previous,
                growth: revenueGrowth.toFixed(2),
                salesGrowth: salesGrowth.toFixed(2)
            };
        } catch (error) {
            logger.warn('Erro ao calcular comparação', error);
            return null;
        }
    }

    /**
     * Invalida cache
     */
    invalidateCache(type = 'all') {
        if (type === 'all') {
            cacheService.cache.clear();
            logger.info('Cache completo limpo');
        } else {
            const keys = Array.from(cacheService.cache.keys());
            const deleted = keys.filter(key => key.startsWith(type));
            deleted.forEach(key => cacheService.delete(key));
            logger.info(`Cache ${type} limpo: ${deleted.length} entradas removidas`);
        }
    }
}

export default AnalyticsService;