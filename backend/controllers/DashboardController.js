// ========== backend/controllers/DashboardController.js - CORRIGIDO ==========
import { AnalyticsService } from '../services/AnalyticsService.js';
import filterService from '../services/FilterService.js';
import logger from '../utils/logger.js';

export class DashboardController {
    constructor() {
        this.analyticsService = new AnalyticsService();
    }

    /**
     * GET /api/dashboard/overview
     */
    async getOverview(req, res) {
        try {
            const filters = this.extractFilters(req.query);
            logger.info('[Dashboard] Carregando overview', filters);
            
            const data = await this.analyticsService.getDashboardOverview(filters);
            
            res.json({
                success: true,
                data
            });
        } catch (error) {
            logger.error('Dashboard overview error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar dashboard',
                message: error.message
            });
        }
    }

    /**
     * Extrai filtros
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
            categoryId: query.categoryId
        };

        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined || filters[key] === null || filters[key] === '') {
                delete filters[key];
            }
        });

        return filterService.validateFilters(filters);
    }

    /**
     * Parse array params
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

export default new DashboardController();