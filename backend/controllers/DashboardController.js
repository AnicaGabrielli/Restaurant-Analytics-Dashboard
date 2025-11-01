// ========== backend/controllers/DashboardController.js ==========
import { AnalyticsService } from '../services/AnalyticsService.js';

export class DashboardController {
    constructor() {
        this.analyticsService = new AnalyticsService();
    }

    async getOverview(req, res) {
        try {
            const data = await this.analyticsService.getDashboardOverview();
            res.json({
                success: true,
                data
            });
        } catch (error) {
            console.error('Dashboard overview error:', error);
            res.status(500).json({
                success: false,
                error: 'Erro ao carregar dashboard'
            });
        }
    }
}
