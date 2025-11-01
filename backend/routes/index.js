import express from 'express';
import DashboardController from '../controllers/DashboardController.js';
import SalesController from '../controllers/SalesController.js';
import ProductController from '../controllers/ProductController.js';
import ExportController from '../controllers/ExportController.js';
import Store from '../models/Store.js';

const router = express.Router();

// Dashboard
router.get('/dashboard', DashboardController.getOverview);

// Sales
router.get('/sales/period', SalesController.getByPeriod);
router.get('/sales/channel', SalesController.getByChannel);
router.get('/sales/store', SalesController.getByStore);
router.get('/sales/hourly', SalesController.getHourlyDistribution);
router.get('/sales/weekday', SalesController.getWeekdayDistribution);
router.get('/sales/delivery', SalesController.getDeliveryPerformance);

// Products
router.get('/products/top', ProductController.getTopProducts);
router.get('/products/category', ProductController.getByCategory);
router.get('/products/customizations', ProductController.getTopCustomizations);
router.get('/products/channel-performance', ProductController.getPerformanceByChannel);

// Filters data
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

// Export
router.post('/export', ExportController.exportData);

// Health check and test endpoint
router.get('/health', async (req, res) => {
  try {
    const db = (await import('../config/database.js')).default;
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM sales');
    res.json({ 
      success: true, 
      database: 'connected',
      salesCount: rows[0].count 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;