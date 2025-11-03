import Performance from '../models/Performance.js';

class PerformanceController {
  static async getDeliveryTimeAnalysis(req, res) {
    try {
      const filters = req.query;
      const data = await Performance.getDeliveryTimeByDayAndHour(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Delivery time analysis error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar análise de tempo de entrega' 
      });
    }
  }

  static async getDeliveryByRegion(req, res) {
    try {
      const filters = req.query;
      const data = await Performance.getDeliveryPerformanceByRegion(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Delivery by region error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar performance por região' 
      });
    }
  }

  static async getStoreEfficiency(req, res) {
    try {
      const filters = req.query;
      const data = await Performance.getStoreEfficiency(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Store efficiency error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar eficiência das lojas' 
      });
    }
  }

  static async getChannelPerformance(req, res) {
    try {
      const filters = req.query;
      const data = await Performance.getChannelPerformance(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Channel performance error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar performance dos canais' 
      });
    }
  }

  static async getPeakHours(req, res) {
    try {
      const filters = req.query;
      const data = await Performance.getPeakHours(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Peak hours error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar horários de pico' 
      });
    }
  }

  static async getCancellationAnalysis(req, res) {
    try {
      const filters = req.query;
      const data = await Performance.getCancellationAnalysis(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Cancellation analysis error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar análise de cancelamentos' 
      });
    }
  }

  static async getTicketComparison(req, res) {
    try {
      const filters = req.query;
      const data = await Performance.getTicketComparison(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Ticket comparison error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar comparativo de ticket médio' 
      });
    }
  }

  static async getOperationalCapacity(req, res) {
    try {
      const filters = req.query;
      const data = await Performance.getOperationalCapacity(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Operational capacity error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar capacidade operacional' 
      });
    }
  }
}

export default PerformanceController;