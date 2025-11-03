import Sale from '../models/Sale.js';

class SalesController {
  static async getByPeriod(req, res) {
    try {
      const filters = req.query;
      const data = await Sale.getSalesByPeriod(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Sales by period error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar vendas por período',
        details: error.message 
      });
    }
  }

  static async getByChannel(req, res) {
    try {
      const filters = req.query;
      const data = await Sale.getSalesByChannel(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Sales by channel error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar vendas por canal',
        details: error.message 
      });
    }
  }

  static async getByStore(req, res) {
    try {
      const filters = req.query;
      const data = await Sale.getSalesByStore(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Sales by store error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar vendas por loja',
        details: error.message 
      });
    }
  }

  static async getHourlyDistribution(req, res) {
    try {
      const filters = req.query;
      const data = await Sale.getHourlyDistribution(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Hourly distribution error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar distribuição horária',
        details: error.message 
      });
    }
  }

  static async getWeekdayDistribution(req, res) {
    try {
      const filters = req.query;
      const data = await Sale.getWeekdayDistribution(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Weekday distribution error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar distribuição semanal',
        details: error.message 
      });
    }
  }

  static async getDeliveryPerformance(req, res) {
    try {
      const filters = req.query;
      const data = await Sale.getDeliveryPerformance(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Delivery performance error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar performance de entrega',
        details: error.message 
      });
    }
  }
}

export default SalesController;