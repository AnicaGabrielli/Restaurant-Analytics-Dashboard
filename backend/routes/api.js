import express from 'express';
import analyticsController from '../controllers/AnalyticsController.js';
import middlewares from '../middlewares/index.js';

const router = express.Router();

// Aplica rate limiting em todas as rotas
router.use(middlewares.rateLimiter);

// Analytics
router.get('/analytics/sales', analyticsController.getSalesAnalytics);
router.get('/analytics/products', analyticsController.getProductAnalytics);
router.get('/analytics/customers', analyticsController.getCustomerAnalytics);
router.get('/analytics/delivery', analyticsController.getDeliveryAnalytics);

// Export (com rate limit mais agressivo)
router.post('/export', 
    middlewares.exportRateLimiter,
    analyticsController.exportData
);

// Health check
router.get('/health', async (req, res) => {
    const dbHealth = await database.healthCheck();
    const cacheStats = cacheService.getStats();
    
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: dbHealth,
        cache: cacheStats
    });
});

export default router;