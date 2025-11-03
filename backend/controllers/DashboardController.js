import Sale from '../models/Sale.js';
import Product from '../models/Product.js';

class DashboardController {
  static async getOverview(req, res) {
    try {
      const filters = req.query;
      
      // Buscar todas as métricas em paralelo
      const [metrics, topProducts, salesByChannel, hourlyDist] = await Promise.all([
        Sale.getMetrics(filters),
        Product.getTopProducts(filters, 10),
        Sale.getSalesByChannel(filters),
        Sale.getHourlyDistribution(filters)
      ]);
      
      // Calcular insights rápidos
      const insights = {
        hasHighCancellation: parseFloat(metrics.cancellation_rate || 0) > 10,
        topChannel: salesByChannel.length > 0 ? salesByChannel[0].channel_name : null,
        peakHour: hourlyDist.length > 0 
          ? hourlyDist.reduce((max, curr) => curr.sales_count > max.sales_count ? curr : max).hour 
          : null
      };
      
      res.json({
        success: true,
        data: {
          metrics,
          topProducts,
          salesByChannel,
          hourlyDistribution: hourlyDist,
          insights
        }
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao carregar dashboard',
        details: error.message 
      });
    }
  }
}

export default DashboardController;