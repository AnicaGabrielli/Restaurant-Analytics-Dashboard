// ========== backend/controllers/AnalyticsController.js - COMPLETAMENTE CORRIGIDO ==========
import { AnalyticsService } from '../services/AnalyticsService.js';
import { ExportService } from '../services/ExportService.js';
import filterService from '../services/FilterService.js';
import logger from '../utils/logger.js';

export class AnalyticsController {
    constructor() {
        this.analyticsService = new AnalyticsService();
        this.exportService = new ExportService();
    }

    /**
     * GET /api/analytics/sales
     */
    async getSalesAnalytics(req, res) {
        try {
            const filters = this.extractFilters(req.query);
            logger.info('[Sales Analytics] Filtros recebidos:', filters);
            
            const data = await this.analyticsService.getSalesAnalytics(filters);
            
            res.json({
                success: true,
                data,
                filters
            });
        } catch (error) {
            logger.error('Sales analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar análise de vendas',
                message: error.message
            });
        }
    }

    /**
     * GET /api/analytics/products
     */
    async getProductAnalytics(req, res) {
        try {
            const filters = this.extractFilters(req.query);
            logger.info('[Product Analytics] Filtros recebidos:', filters);
            
            const data = await this.analyticsService.getProductAnalytics(filters);
            
            res.json({
                success: true,
                data,
                filters
            });
        } catch (error) {
            logger.error('Product analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar análise de produtos',
                message: error.message
            });
        }
    }

    /**
     * GET /api/analytics/customers
     */
    async getCustomerAnalytics(req, res) {
        try {
            const filters = this.extractFilters(req.query);
            logger.info('[Customer Analytics] Filtros recebidos:', filters);
            
            const data = await this.analyticsService.getCustomerAnalytics(filters);
            
            res.json({
                success: true,
                data,
                filters
            });
        } catch (error) {
            logger.error('Customer analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar análise de clientes',
                message: error.message
            });
        }
    }

    /**
     * GET /api/analytics/delivery
     */
    async getDeliveryAnalytics(req, res) {
        try {
            const filters = this.extractFilters(req.query);
            logger.info('[Delivery Analytics] Filtros recebidos:', filters);
            
            const data = await this.analyticsService.getDeliveryAnalytics(filters);
            
            res.json({
                success: true,
                data,
                filters
            });
        } catch (error) {
            logger.error('Delivery analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar análise de entregas',
                message: error.message
            });
        }
    }

    /**
     * GET /api/search
     */
    async search(req, res) {
        try {
            const { term, type = 'product', page = 1, limit = 50 } = req.query;
            
            if (!term || term.length < 2) {
                return res.status(400).json({
                    success: false,
                    error: 'Termo de busca deve ter pelo menos 2 caracteres'
                });
            }

            const filters = this.extractFilters(req.query);
            const data = await this.analyticsService.search(term, type, filters, page, limit);
            
            res.json({
                success: true,
                data,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            logger.error('Search error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro na busca',
                message: error.message
            });
        }
    }

    /**
     * POST /api/export
     */
    async exportData(req, res) {
        try {
            const { type = 'sales', format = 'csv' } = req.body;
            const filters = this.extractFilters(req.body.filters || {});

            logger.info('[Export] Tipo:', type, 'Formato:', format, 'Filtros:', filters);

            const data = await this.analyticsService.getExportData(type, filters, 10000);
            this.exportService.validateExportLimit(data.length);

            let formattedData, columns, content, contentType, filename;

            switch (type) {
                case 'sales':
                    formattedData = this.exportService.formatSalesExport(data);
                    columns = this.exportService.getSalesColumns();
                    break;
                case 'products':
                    formattedData = this.exportService.formatProductsExport(data);
                    columns = this.exportService.getProductsColumns();
                    break;
                case 'customers':
                    formattedData = this.exportService.formatCustomersExport(data);
                    columns = this.exportService.getCustomersColumns();
                    break;
                case 'deliveries':
                    formattedData = this.exportService.formatDeliveriesExport(data);
                    columns = this.exportService.getDeliveriesColumns();
                    break;
                default:
                    throw new Error('Tipo de exportação inválido');
            }

            if (format === 'csv') {
                content = this.exportService.toCSV(formattedData, columns);
                contentType = 'text/csv; charset=utf-8';
                filename = this.exportService.generateFilename(type, 'csv');
            } else if (format === 'json') {
                content = this.exportService.toJSON(formattedData);
                contentType = 'application/json';
                filename = this.exportService.generateFilename(type, 'json');
            } else {
                throw new Error('Formato de exportação inválido');
            }

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(content);

        } catch (error) {
            logger.error('Export error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro na exportação',
                message: error.message
            });
        }
    }

    /**
     * GET /api/filters/options
     */
    async getFilterOptions(req, res) {
        try {
            const data = await this.analyticsService.getFilterOptions();
            
            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('Filter options error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar opções de filtro',
                message: error.message
            });
        }
    }

    /**
     * POST /api/cache/clear
     */
    async clearCache(req, res) {
        try {
            const { type = 'all' } = req.body;
            this.analyticsService.invalidateCache(type);
            
            res.json({
                success: true,
                message: `Cache ${type} limpo com sucesso`
            });
        } catch (error) {
            logger.error('Clear cache error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao limpar cache'
            });
        }
    }

    /**
     * GET /api/stats/cache
     */
    async getCacheStats(req, res) {
        try {
            const cacheService = (await import('../services/CacheService.js')).default;
            const stats = cacheService.getStats();
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            logger.error('Cache stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao obter estatísticas de cache'
            });
        }
    }

    /**
     * Extrai e valida filtros da requisição
     * @private
     */
    extractFilters(query) {
        const filters = {
            period: query.period,
            startDate: query.startDate,
            endDate: query.endDate,
            channelIds: this.parseArrayParam(query.channelIds),
            storeIds: this.parseArrayParam(query.storeIds),
            status: query.status || 'COMPLETED',
            categoryId: query.categoryId,
            customerId: query.customerId,
            minAmount: query.minAmount,
            maxAmount: query.maxAmount,
            search: query.search,
            searchField: query.searchField
        };

        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined || filters[key] === null || filters[key] === '') {
                delete filters[key];
            }
        });

        return filterService.validateFilters(filters);
    }

    /**
     * Parse parâmetros de array
     * @private
     */
    parseArrayParam(param) {
        if (!param) return [];
        
        if (Array.isArray(param)) {
            return param.map(id => parseInt(id)).filter(id => !isNaN(id));
        } else if (typeof param === 'string') {
            return param.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
        }
        
        return [];
    }
}

export default new AnalyticsController();