// ========== backend/routes/api.js ==========
import express from 'express';
import { DashboardController } from '../controllers/DashboardController.js';
import { AnalyticsController } from '../controllers/AnalyticsController.js';

const router = express.Router();

const dashboardController = new DashboardController();
const analyticsController = new AnalyticsController();

// Dashboard routes
router.get('/dashboard/overview', (req, res) => 
    dashboardController.getOverview(req, res)
);

// Analytics routes
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

// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;