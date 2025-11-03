import Performance from '../models/Performance.js';

class PerformanceController {
  static async getDeliveryTimeAnalysis(req, res) {
    try {
      console.log('📊 Performance: getDeliveryTimeAnalysis chamado', req.query);
      const filters = req.query;
      const data = await Performance.getDeliveryTimeByDayAndHour(filters);
      console.log('✅ Performance: Delivery time data:', data?.length, 'registros');
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ Delivery time analysis error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar análise de tempo de entrega',
        details: error.message
      });
    }
  }

  static async getDeliveryByRegion(req, res) {
    try {
      console.log('📊 Performance: getDeliveryByRegion chamado', req.query);
      const filters = req.query;
      const data = await Performance.getDeliveryPerformanceByRegion(filters);
      console.log('✅ Performance: Delivery by region:', data?.length, 'registros');
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ Delivery by region error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar performance por região',
        details: error.message
      });
    }
  }

  static async getStoreEfficiency(req, res) {
    try {
      console.log('📊 Performance: getStoreEfficiency chamado', req.query);
      const filters = req.query;
      const data = await Performance.getStoreEfficiency(filters);
      console.log('✅ Performance: Store efficiency:', data?.length, 'registros');
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ Store efficiency error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar eficiência das lojas',
        details: error.message
      });
    }
  }

  static async getChannelPerformance(req, res) {
    try {
      console.log('📊 Performance: getChannelPerformance chamado', req.query);
      const filters = req.query;
      const data = await Performance.getChannelPerformance(filters);
      console.log('✅ Performance: Channel performance:', data?.length, 'registros');
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ Channel performance error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar performance dos canais',
        details: error.message
      });
    }
  }

  static async getPeakHours(req, res) {
    try {
      console.log('📊 Performance: getPeakHours chamado', req.query);
      const filters = req.query;
      const data = await Performance.getPeakHours(filters);
      console.log('✅ Performance: Peak hours:', data?.length, 'registros');
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ Peak hours error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar horários de pico',
        details: error.message
      });
    }
  }

  static async getCancellationAnalysis(req, res) {
    try {
      console.log('📊 Performance: getCancellationAnalysis chamado', req.query);
      const filters = req.query;
      const data = await Performance.getCancellationAnalysis(filters);
      console.log('✅ Performance: Cancellation analysis:', data?.length, 'registros');
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ Cancellation analysis error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar análise de cancelamentos',
        details: error.message
      });
    }
  }

  static async getTicketComparison(req, res) {
    try {
      console.log('📊 Performance: getTicketComparison chamado', req.query);
      const filters = req.query;
      const data = await Performance.getTicketComparison(filters);
      console.log('✅ Performance: Ticket comparison:', data?.length, 'registros');
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ Ticket comparison error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar comparativo de ticket médio',
        details: error.message
      });
    }
  }

  static async getOperationalCapacity(req, res) {
    try {
      console.log('📊 Performance: getOperationalCapacity chamado', req.query);
      const filters = req.query;
      const data = await Performance.getOperationalCapacity(filters);
      console.log('✅ Performance: Operational capacity:', data?.length, 'registros');
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('❌ Operational capacity error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar capacidade operacional',
        details: error.message
      });
    }
  }
}

export default PerformanceController;