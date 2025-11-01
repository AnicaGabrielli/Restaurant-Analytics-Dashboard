// ========== backend/controllers/AnalyticsController.js ==========
import { AnalyticsService } from '../services/AnalyticsService.js';

export class AnalyticsController {
    constructor() {
        this.analyticsService = new AnalyticsService();
    }

    async getSalesAnalytics(req, res) {
        try {
            const data = await this.analyticsService.getSalesAnalytics();
            res.json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Sales analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar análise de vendas'
            });
        }
    }

    async getProductAnalytics(req, res) {
        try {
            const data = await this.analyticsService.getProductAnalytics();
            res.json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Product analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar análise de produtos'
            });
        }
    }

    async getCustomerAnalytics(req, res) {
        try {
            const data = await this.analyticsService.getCustomerAnalytics();
            res.json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Customer analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar análise de clientes'
            });
        }
    }

    async getDeliveryAnalytics(req, res) {
        try {
            const data = await this.analyticsService.getDeliveryAnalytics();
            res.json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Delivery analytics error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar análise de entregas'
            });
        }
    }
}
