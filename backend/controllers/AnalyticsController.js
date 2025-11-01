// ========== backend/controllers/AnalyticsController.js ==========
import analyticsService from '../services/AnalyticsService.js';
import exportService from '../services/ExportService.js';
import filterService from '../services/FilterService.js';

export class AnalyticsController {
    /**
     * GET /api/analytics/sales
     * Retorna análise de vendas com filtros
     */
    async getSalesAnalytics(req, res) {
        try {
            const filters = this.extractFilters(req.query);
            const data = await analyticsService.getSalesAnalytics(filters);
            
            res.json({
                success: true,
                data,
                filters: filters
            });
        } catch (error) {
            console.error('Sales analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar análise de vendas',
                message: error.message
            });
        }
    }

    /**
     * GET /api/analytics/products
     * Retorna análise de produtos com filtros
     */
    async getProductAnalytics(req, res) {
        try {
            const filters = this.extractFilters(req.query);
            const data = await analyticsService.getProductAnalytics(filters);
            
            res.json({
                success: true,
                data,
                filters: filters
            });
        } catch (error) {
            console.error('Product analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar análise de produtos'
            });
        }
    }

    /**
     * GET /api/analytics/customers
     * Retorna análise de clientes com filtros
     */
    async getCustomerAnalytics(req, res) {
        try {
            const filters = this.extractFilters(req.query);
            const data = await analyticsService.getCustomerAnalytics(filters);
            
            res.json({
                success: true,
                data,
                filters: filters
            });
        } catch (error) {
            console.error('Customer analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar análise de clientes'
            });
        }
    }

    /**
     * GET /api/analytics/delivery
     * Retorna análise de entregas com filtros
     */
    async getDeliveryAnalytics(req, res) {
        try {
            const filters = this.extractFilters(req.query);
            const data = await analyticsService.getDeliveryAnalytics(filters);
            
            res.json({
                success: true,
                data,
                filters: filters
            });
        } catch (error) {
            console.error('Delivery analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar análise de entregas'
            });
        }
    }

    /**
     * GET /api/search
     * Busca geral com paginação
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
            const data = await analyticsService.search(term, type, filters, page, limit);
            
            res.json({
                success: true,
                data,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit)
                }
            });
        } catch (error) {
            console.error('Search error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro na busca'
            });
        }
    }

    /**
     * POST /api/export
     * Exporta dados filtrados
     */
    async exportData(req, res) {
        try {
            const { type = 'sales', format = 'csv' } = req.body;
            const filters = this.extractFilters(req.body.filters || {});

            // Busca dados com limite de exportação
            const data = await analyticsService.getExportData(type, filters, 10000);

            // Valida quantidade
            exportService.validateExportLimit(data.length);

            // Formata dados baseado no tipo
            let formattedData;
            let columns;

            switch (type) {
                case 'sales':
                    formattedData = exportService.formatSalesExport(data);
                    columns = exportService.getSalesColumns();
                    break;
                case 'products':
                    formattedData = exportService.formatProductsExport(data);
                    break;
                case 'customers':
                    formattedData = exportService.formatCustomersExport(data);
                    break;
                case 'deliveries':
                    formattedData = exportService.formatDeliveriesExport(data);
                    break;
                default:
                    throw new Error('Tipo de exportação inválido');
            }

            // Gera conteúdo baseado no formato
            let content, contentType, filename;

            if (format === 'csv') {
                content = exportService.toExcelCSV(formattedData, columns);
                contentType = 'text/csv; charset=utf-8';
                filename = exportService.generateFilename(type, 'csv');
            } else if (format === 'json') {
                content = exportService.toJSON(formattedData);
                contentType = 'application/json';
                filename = exportService.generateFilename(type, 'json');
            } else {
                throw new Error('Formato de exportação inválido');
            }

            // Envia arquivo
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(content);

        } catch (error) {
            console.error('Export error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro na exportação',
                message: error.message
            });
        }
    }

    /**
     * GET /api/filters/options
     * Retorna opções disponíveis para filtros (lojas, canais, etc)
     */
    async getFilterOptions(req, res) {
        try {
            const [stores, channels, categories, statuses] = await Promise.all([
                analyticsService.saleModel.query('SELECT id, name, city FROM stores WHERE is_active = true ORDER BY name'),
                analyticsService.saleModel.query('SELECT id, name, type FROM channels ORDER BY name'),
                analyticsService.productModel.query('SELECT DISTINCT id, name FROM categories WHERE type = "P" AND deleted_at IS NULL ORDER BY name'),
                [
                    { value: 'COMPLETED', label: 'Completo' },
                    { value: 'CANCELLED', label: 'Cancelado' }
                ]
            ]);

            res.json({
                success: true,
                data: {
                    stores,
                    channels,
                    categories,
                    statuses,
                    periods: [
                        { value: 'last7days', label: 'Últimos 7 dias' },
                        { value: 'last30days', label: 'Últimos 30 dias' },
                        { value: 'last90days', label: 'Últimos 90 dias' },
                        { value: 'thisMonth', label: 'Este mês' },
                        { value: 'lastMonth', label: 'Mês passado' },
                        { value: 'thisYear', label: 'Este ano' },
                        { value: 'custom', label: 'Personalizado' }
                    ]
                }
            });
        } catch (error) {
            console.error('Filter options error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar opções de filtro'
            });
        }
    }

    /**
     * POST /api/cache/clear
     * Limpa cache (admin only)
     */
    async clearCache(req, res) {
        try {
            const { type = 'all' } = req.body;
            analyticsService.invalidateCache(type);
            
            res.json({
                success: true,
                message: `Cache ${type} limpo com sucesso`
            });
        } catch (error) {
            console.error('Clear cache error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao limpar cache'
            });
        }
    }

    /**
     * GET /api/stats/cache
     * Retorna estatísticas de cache
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
            console.error('Cache stats error:', error);
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
        return {
            period: query.period,
            startDate: query.startDate,
            endDate: query.endDate,
            channelIds: query.channelIds,
            storeIds: query.storeIds,
            status: query.status,
            categoryId: query.categoryId,
            customerId: query.customerId,
            minAmount: query.minAmount,
            maxAmount: query.maxAmount,
            search: query.search,
            searchField: query.searchField
        };
    }
}

export default new AnalyticsController();