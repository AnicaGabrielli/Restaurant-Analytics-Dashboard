import express from 'express';
import DashboardController from '../controllers/DashboardController.js';
import SalesController from '../controllers/SalesController.js';
import ProductController from '../controllers/ProductController.js';
import CustomerController from '../controllers/CustomerController.js';
import PerformanceController from '../controllers/PerformanceController.js';
import InsightsController from '../controllers/InsightsController.js';
import ExportController from '../controllers/ExportController.js';
import Store from '../models/Store.js';

const router = express.Router();

// ===== DASHBOARD =====
router.get('/dashboard', DashboardController.getOverview);

// ===== SALES =====
router.get('/sales/period', SalesController.getByPeriod);
router.get('/sales/channel', SalesController.getByChannel);
router.get('/sales/store', SalesController.getByStore);
router.get('/sales/hourly', SalesController.getHourlyDistribution);
router.get('/sales/weekday', SalesController.getWeekdayDistribution);
router.get('/sales/delivery', SalesController.getDeliveryPerformance);

// ===== PRODUCTS =====
router.get('/products/top', ProductController.getTopProducts);
router.get('/products/category', ProductController.getByCategory);
router.get('/products/customizations', ProductController.getTopCustomizations);
router.get('/products/channel-performance', ProductController.getPerformanceByChannel);
router.get('/products/low-margin', ProductController.getLowMarginProducts);
router.get('/products/by-day-hour', ProductController.getProductsByDayAndHour);

// ===== CUSTOMERS (NOVO) =====
router.get('/customers/rfm', CustomerController.getRFMAnalysis);
router.get('/customers/churn', CustomerController.getChurnRisk);
router.get('/customers/ltv', CustomerController.getLTVBySegment);
router.get('/customers/top', CustomerController.getTopCustomers);
router.get('/customers/frequency', CustomerController.getPurchaseFrequency);
router.get('/customers/new', CustomerController.getNewCustomers);
router.get('/customers/retention', CustomerController.getRetentionRate);

// ===== PERFORMANCE (NOVO) =====
router.get('/performance/delivery-time', PerformanceController.getDeliveryTimeAnalysis);
router.get('/performance/delivery-region', PerformanceController.getDeliveryByRegion);
router.get('/performance/store-efficiency', PerformanceController.getStoreEfficiency);
router.get('/performance/channel', PerformanceController.getChannelPerformance);
router.get('/performance/peak-hours', PerformanceController.getPeakHours);
router.get('/performance/cancellation', PerformanceController.getCancellationAnalysis);
router.get('/performance/ticket-comparison', PerformanceController.getTicketComparison);
router.get('/performance/capacity', PerformanceController.getOperationalCapacity);

// ===== INSIGHTS (NOVO) =====
router.get('/insights/product-by-channel-day-hour', InsightsController.getProductByChannelDayHour);
router.get('/insights/ticket-trend', InsightsController.getTicketTrendAnalysis);
router.get('/insights/low-margin', InsightsController.getLowMarginProducts);
router.get('/insights/delivery-degradation', InsightsController.getDeliveryDegradation);

// ===== FILTERS DATA =====
router.get('/stores', async (req, res) => {
  try {
    const stores = await Store.getAll();
    res.json({ success: true, data: stores });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao buscar lojas' });
  }
});

router.get('/channels', async (req, res) => {
  try {
    const channels = await Store.getChannels();
    res.json({ success: true, data: channels });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao buscar canais' });
  }
});

router.get('/categories', async (req, res) => {
  try {
    const categories = await Store.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao buscar categorias' });
  }
});

// ===== EXPORT =====
router.post('/export/csv', ExportController.exportCSV);
router.post('/export/pdf', ExportController.exportPDF);

// ===== HEALTH CHECK =====
router.get('/health', async (req, res) => {
  try {
    const db = (await import('../config/database.js')).default;
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM sales');
    res.json({ 
      success: true, 
      database: 'connected',
      salesCount: rows[0].count,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;