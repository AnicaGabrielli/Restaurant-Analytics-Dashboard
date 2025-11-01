// ========== backend/services/AnalyticsService.js ==========
import { Sale } from '../models/Sale.js';
import { Product } from '../models/Product.js';
import { Item } from '../models/Item.js';
import { Customer } from '../models/Customer.js';
import { Delivery } from '../models/Delivery.js';
import cacheService from './CacheService.js';
import filterService from './FilterService.js';

export class AnalyticsService {
    constructor() {
        this.saleModel = new Sale();
        this.productModel = new Product();
        this.itemModel = new Item();
        this.customerModel = new Customer();
        this.deliveryModel = new Delivery();
    }

    /**
     * Dashboard principal com cache
     */
    async getDashboardOverview(filters = {}) {
        const cacheKey = filterService.generateCacheKey('dashboard:overview', filters);
        
        return await cacheService.getOrSet(cacheKey, async () => {
            const validatedFilters = filterService.validateFilters(filters);

            const [
                revenue,
                salesByPeriod,
                salesByChannel,
                topProducts,
                topItems,
                productionTime,
                deliveryTime,
                comparisonData
            ] = await Promise.all([
                this.saleModel.getTotalRevenue(validatedFilters),
                this.saleModel.getSalesByPeriod('day', 30, validatedFilters),
                this.saleModel.getSalesByChannel(validatedFilters),
                this.productModel.getTopSellingProducts(10, validatedFilters),
                this.itemModel.getTopItems(10, validatedFilters),
                this.saleModel.getAverageProductionTime(validatedFilters),
                this.saleModel.getAverageDeliveryTime(validatedFilters),
                this.getComparisonData(validatedFilters)
            ]);

            return {
                revenue,
                salesByPeriod,
                salesByChannel,
                topProducts,
                topItems,
                operationalMetrics: {
                    production: productionTime,
                    delivery: deliveryTime
                },
                comparison: comparisonData
            };
        }, 300); // 5 minutos
    }

    /**
     * Análise de vendas com filtros
     */
    async getSalesAnalytics(filters = {}) {
        const cacheKey = filterService.generateCacheKey('sales:analytics', filters);
        
        return await cacheService.getOrSet(cacheKey, async () => {
            const validatedFilters = filterService.validateFilters(filters);

            const [
                byChannel,
                byStore,
                byHour,
                byWeekday,
                cancellationRate,
                growthData
            ] = await Promise.all([
                this.saleModel.getSalesByChannel(validatedFilters),
                this.saleModel.getSalesByStore(15, validatedFilters),
                this.saleModel.getSalesByHour(validatedFilters),
                this.saleModel.getSalesByWeekday(validatedFilters),
                this.saleModel.getCancellationRate(validatedFilters),
                this.calculateGrowth(validatedFilters)
            ]);

            return {
                byChannel,
                byStore,
                byHour,
                byWeekday,
                cancellationRate,
                growth: growthData
            };
        }, 180); // 3 minutos
    }

    /**
     * Análise de produtos com filtros
     */
    async getProductAnalytics(filters = {}) {
        const cacheKey = filterService.generateCacheKey('products:analytics', filters);
        
        return await cacheService.getOrSet(cacheKey, async () => {
            const validatedFilters = filterService.validateFilters(filters);

            const [
                topProducts,
                byCategory,
                mostCustomized,
                lowPerformers
            ] = await Promise.all([
                this.productModel.getTopSellingProducts(20, validatedFilters),
                this.productModel.getProductsByCategory(validatedFilters),
                this.productModel.getMostCustomizedProducts(15, validatedFilters),
                this.productModel.getLowPerformingProducts(10, validatedFilters)
            ]);

            return {
                topProducts,
                byCategory,
                mostCustomized,
                lowPerformers
            };
        }, 600); // 10 minutos
    }

    /**
     * Análise de clientes com filtros
     */
    async getCustomerAnalytics(filters = {}) {
        const cacheKey = filterService.generateCacheKey('customers:analytics', filters);
        
        return await cacheService.getOrSet(cacheKey, async () => {
            const validatedFilters = filterService.validateFilters(filters);

            const [
                retention,
                topCustomers,
                newVsReturning,
                lifetimeValue,
                churnRisk
            ] = await Promise.all([
                this.customerModel.getCustomerRetention(validatedFilters),
                this.customerModel.getTopCustomers(15, validatedFilters),
                this.customerModel.getNewVsReturning(validatedFilters),
                this.customerModel.getLifetimeValueAnalysis(validatedFilters),
                this.customerModel.getChurnRiskCustomers(validatedFilters)
            ]);

            return {
                retention,
                topCustomers,
                newVsReturning,
                lifetimeValue,
                churnRisk
            };
        }, 600); // 10 minutos
    }

    /**
     * Análise de entregas com filtros
     */
    async getDeliveryAnalytics(filters = {}) {
        const cacheKey = filterService.generateCacheKey('delivery:analytics', filters);
        
        return await cacheService.getOrSet(cacheKey, async () => {
            const validatedFilters = filterService.validateFilters(filters);

            const [
                byRegion,
                stats,
                topNeighborhoods,
                performanceMetrics
            ] = await Promise.all([
                this.deliveryModel.getDeliveryPerformanceByRegion(validatedFilters),
                this.deliveryModel.getDeliveryStats(validatedFilters),
                this.deliveryModel.getTopDeliveryNeighborhoods(15, validatedFilters),
                this.deliveryModel.getPerformanceMetrics(validatedFilters)
            ]);

            return {
                byRegion,
                stats,
                topNeighborhoods,
                performance: performanceMetrics
            };
        }, 300); // 5 minutos
    }

    /**
     * Busca com filtros e paginação
     */
    async search(searchTerm, searchType, filters = {}, page = 1, limit = 50) {
        const validatedFilters = {
            ...filterService.validateFilters(filters),
            search: searchTerm,
            searchField: searchType
        };

        const cacheKey = filterService.generateCacheKey(
            `search:${searchType}`,
            { ...validatedFilters, page, limit }
        );

        return await cacheService.getOrSet(cacheKey, async () => {
            switch (searchType) {
                case 'product':
                    return await this.productModel.searchProducts(searchTerm, validatedFilters, page, limit);
                case 'customer':
                    return await this.customerModel.searchCustomers(searchTerm, validatedFilters, page, limit);
                case 'sale':
                    return await this.saleModel.searchSales(searchTerm, validatedFilters, page, limit);
                default:
                    throw new Error('Tipo de busca inválido');
            }
        }, 60); // 1 minuto
    }

    /**
     * Dados de comparação (período atual vs anterior)
     */
    async getComparisonData(filters) {
        // Calcula período anterior baseado nos filtros
        const currentPeriod = await this.saleModel.getTotalRevenue(filters);
        
        // Ajusta filtros para período anterior
        const previousFilters = this.calculatePreviousPeriod(filters);
        const previousPeriod = await this.saleModel.getTotalRevenue(previousFilters);

        return {
            current: currentPeriod,
            previous: previousPeriod,
            growth: this.calculatePercentageGrowth(
                currentPeriod.total_revenue,
                previousPeriod.total_revenue
            ),
            salesGrowth: this.calculatePercentageGrowth(
                currentPeriod.total_sales,
                previousPeriod.total_sales
            )
        };
    }

    /**
     * Calcula crescimento percentual
     */
    calculatePercentageGrowth(current, previous) {
        if (!previous || previous === 0) return 0;
        return (((current - previous) / previous) * 100).toFixed(2);
    }

    /**
     * Calcula período anterior baseado em filtros
     */
    calculatePreviousPeriod(filters) {
        const previousFilters = { ...filters };

        if (filters.startDate && filters.endDate) {
            const start = new Date(filters.startDate);
            const end = new Date(filters.endDate);
            const duration = end - start;

            previousFilters.startDate = new Date(start.getTime() - duration).toISOString().split('T')[0];
            previousFilters.endDate = new Date(start.getTime() - 1).toISOString().split('T')[0];
        } else if (filters.period === 'last30days') {
            previousFilters.period = 'previous30days';
        }

        return previousFilters;
    }

    /**
     * Calcula taxa de crescimento
     */
    async calculateGrowth(filters) {
        const comparison = await this.getComparisonData(filters);
        
        return {
            revenue: comparison.growth,
            sales: comparison.salesGrowth,
            trend: parseFloat(comparison.growth) > 0 ? 'up' : 'down'
        };
    }

    /**
     * Exporta dados com filtros
     */
    async getExportData(exportType, filters = {}, limit = 10000) {
        const validatedFilters = filterService.validateFilters(filters);

        switch (exportType) {
            case 'sales':
                return await this.saleModel.getFilteredSales(validatedFilters, 1, limit);
            case 'products':
                return await this.productModel.getTopSellingProducts(limit, validatedFilters);
            case 'customers':
                return await this.customerModel.getTopCustomers(limit, validatedFilters);
            case 'deliveries':
                return await this.deliveryModel.getTopDeliveryNeighborhoods(limit, validatedFilters);
            default:
                throw new Error('Tipo de exportação inválido');
        }
    }

    /**
     * Invalida cache após mudanças nos dados
     */
    invalidateCache(type = 'all') {
        switch (type) {
            case 'sales':
                cacheService.invalidateSales();
                break;
            case 'products':
                cacheService.invalidateProducts();
                break;
            case 'customers':
                cacheService.invalidateCustomers();
                break;
            case 'delivery':
                cacheService.invalidateDelivery();
                break;
            default:
                cacheService.clear();
        }
    }
}

export default new AnalyticsService();