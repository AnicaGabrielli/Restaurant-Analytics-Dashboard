// ========== backend/routes/api.js - CORRIGIDO ==========
import express from 'express';
import analyticsController from '../controllers/AnalyticsController.js';
import dashboardController from '../controllers/DashboardController.js';
import middlewares from '../middlewares/index.js';
import database from '../config/database.js';
import cacheService from '../services/CacheService.js';

const router = express.Router();

// Rate limiting em todas as rotas
router.use(middlewares.rateLimiter);

// ===== DASHBOARD =====
router.get('/dashboard/overview', (req, res) => dashboardController.getOverview(req, res));

// ===== ANALYTICS =====
router.get('/analytics/sales', (req, res) => analyticsController.getSalesAnalytics(req, res));
router.get('/analytics/products', (req, res) => analyticsController.getProductAnalytics(req, res));
router.get('/analytics/customers', (req, res) => analyticsController.getCustomerAnalytics(req, res));
router.get('/analytics/delivery', (req, res) => analyticsController.getDeliveryAnalytics(req, res));

// ===== BUSCA =====
router.get('/search', (req, res) => analyticsController.search(req, res));

// ===== FILTROS =====
router.get('/filters/options', (req, res) => analyticsController.getFilterOptions(req, res));

// ===== EXPORT (com rate limit agressivo) =====
router.post('/export', 
    middlewares.exportRateLimiter,
    (req, res) => analyticsController.exportData(req, res)
);

// ===== CACHE =====
router.post('/cache/clear', (req, res) => analyticsController.clearCache(req, res));
router.get('/stats/cache', (req, res) => analyticsController.getCacheStats(req, res));

// ===== HEALTH CHECK =====
router.get('/health', async (req, res) => {
    try {
        const dbHealth = await database.healthCheck();
        const cacheStats = cacheService.getStats();
        
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            database: dbHealth,
            cache: cacheStats
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

export default router;