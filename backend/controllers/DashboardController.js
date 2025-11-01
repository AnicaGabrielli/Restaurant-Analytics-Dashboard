import Sale from '../models/Sale.js';
import Product from '../models/Product.js';

class DashboardController {
  static async getOverview(req, res) {
    try {
      const filters = req.query;
      
      const metrics = await Sale.getMetrics(filters);
      const topProducts = await Product.getTopProducts(filters, 10);
      const salesByChannel = await Sale.getSalesByChannel(filters);
      const hourlyDist = await Sale.getHourlyDistribution(filters);
      
      res.json({
        success: true,
        data: {
          metrics,
          topProducts,
          salesByChannel,
          hourlyDistribution: hourlyDist
        }
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao carregar dashboard' 
      });
    }
  }
}

export default DashboardController;