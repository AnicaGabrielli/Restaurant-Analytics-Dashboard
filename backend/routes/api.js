// ========== backend/routes/api.js ==========
import express from 'express';
import { DashboardController } from '../controllers/DashboardController.js';
import analyticsController from '../controllers/AnalyticsController.js';

const router = express.Router();
const dashboardController = new DashboardController();

// ===== DASHBOARD ROUTES =====
router.get('/dashboard/overview', (req, res) => 
    dashboardController.getOverview(req, res)
);

// ===== ANALYTICS ROUTES =====
router.get('/analytics/sales', (req, res) => 
    analyticsController.getSalesAnalytics(req, res)
);

router.get('/analytics/products', (req, res) => 
    analyticsController.getProductAnalytics(req, res)
);

router.get('/analytics/customers', (req, res) => 
    analyticsController.getCustomerAnalytics(req, res)
);

router.get('/analytics/delivery', (req, res) => 
    analyticsController.getDeliveryAnalytics(req, res)
);

// ===== SEARCH ROUTES =====
router.get('/search', (req, res) => 
    analyticsController.search(req, res)
);

// ===== EXPORT ROUTES =====
router.post('/export', (req, res) => 
    analyticsController.exportData(req, res)
);

// ===== FILTER OPTIONS =====
router.get('/filters/options', (req, res) => 
    analyticsController.getFilterOptions(req, res)
);

// ===== CACHE MANAGEMENT =====
router.post('/cache/clear', (req, res) => 
    analyticsController.clearCache(req, res)
);

router.get('/stats/cache', (req, res) => 
    analyticsController.getCacheStats(req, res)
);

// ===== HEALTH CHECK =====
router.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// ===== ERROR HANDLING =====
router.use((err, req, res, next) => {
    console.error('API Error:', err);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

export default router;