import Product from '../models/Product.js';
import Performance from '../models/Performance.js';

class InsightsController {
  // Responde: "Qual produto vende mais na quinta à noite no iFood?"
  static async getProductByChannelDayHour(req, res) {
    try {
      const { channelId, weekday, hour } = req.query;
      
      if (!channelId || !weekday || !hour) {
        return res.status(400).json({
          success: false,
          error: 'Parâmetros obrigatórios: channelId, weekday, hour'
        });
      }

      const filters = {
        ...req.query,
        weekday: parseInt(weekday),
        hour: parseInt(hour)
      };

      const data = await Product.getProductsByChannelAndDay(filters);
      
      res.json({ 
        success: true, 
        data,
        insight: `Produtos mais vendidos no canal especificado ${this.getWeekdayName(weekday)} às ${hour}h`
      });
    } catch (error) {
      console.error('Product by channel/day/hour error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar produtos por canal, dia e hora' 
      });
    }
  }

  // Responde: "Meu ticket médio está caindo. É por canal ou por loja?"
  static async getTicketTrendAnalysis(req, res) {
    try {
      const filters = req.query;
      const comparison = await Performance.getTicketComparison(filters);
      
      // Agrupar por tipo
      const stores = comparison.filter(item => item.type === 'Loja');
      const channels = comparison.filter(item => item.type === 'Canal');
      
      // Calcular médias
      const avgStoreTicket = stores.reduce((sum, s) => sum + parseFloat(s.avg_ticket), 0) / stores.length;
      const avgChannelTicket = channels.reduce((sum, c) => sum + parseFloat(c.avg_ticket), 0) / channels.length;
      
      // Identificar outliers
      const lowPerformingStores = stores.filter(s => parseFloat(s.avg_ticket) < avgStoreTicket * 0.8);
      const lowPerformingChannels = channels.filter(c => parseFloat(c.avg_ticket) < avgChannelTicket * 0.8);
      
      let insight = '';
      if (lowPerformingStores.length > lowPerformingChannels.length) {
        insight = `O ticket médio está mais baixo em ${lowPerformingStores.length} loja(s): ${lowPerformingStores.map(s => s.name).join(', ')}`;
      } else if (lowPerformingChannels.length > 0) {
        insight = `O ticket médio está mais baixo em ${lowPerformingChannels.length} canal(is): ${lowPerformingChannels.map(c => c.name).join(', ')}`;
      } else {
        insight = 'O ticket médio está equilibrado entre lojas e canais';
      }
      
      res.json({ 
        success: true, 
        data: {
          stores,
          channels,
          avgStoreTicket,
          avgChannelTicket,
          lowPerformingStores,
          lowPerformingChannels
        },
        insight
      });
    } catch (error) {
      console.error('Ticket trend analysis error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao analisar tendência de ticket médio' 
      });
    }
  }

  // Responde: "Quais produtos têm menor margem e devo repensar o preço?"
  static async getLowMarginProducts(req, res) {
    try {
      const filters = req.query;
      const limit = parseInt(req.query.limit) || 20;
      const data = await Product.getLowMarginProducts(filters, limit);
      
      const criticalProducts = data.filter(p => parseFloat(p.profit_margin_percent) < 20);
      const warningProducts = data.filter(p => 
        parseFloat(p.profit_margin_percent) >= 20 && 
        parseFloat(p.profit_margin_percent) < 30
      );
      
      const insight = `${criticalProducts.length} produto(s) com margem crítica (<20%) e ${warningProducts.length} com margem de atenção (20-30%)`;
      
      res.json({ 
        success: true, 
        data,
        criticalProducts,
        warningProducts,
        insight
      });
    } catch (error) {
      console.error('Low margin products error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar produtos com baixa margem' 
      });
    }
  }

  // Responde: "Meu tempo de entrega piorou. Em quais dias/horários?"
  static async getDeliveryDegradation(req, res) {
    try {
      const filters = req.query;
      const data = await Performance.getDeliveryTimeByDayAndHour(filters);
      
      if (data.length === 0) {
        return res.json({
          success: true,
          data: [],
          insight: 'Não há dados suficientes de tempo de entrega'
        });
      }
      
      // Calcular média geral
      const overallAvg = data.reduce((sum, item) => sum + parseFloat(item.avg_delivery_minutes), 0) / data.length;
      
      // Identificar períodos problemáticos (>20% acima da média)
      const problematicPeriods = data.filter(item => 
        parseFloat(item.avg_delivery_minutes) > overallAvg * 1.2
      ).map(item => ({
        ...item,
        weekdayName: this.getWeekdayName(item.weekday),
        degradation: ((parseFloat(item.avg_delivery_minutes) - overallAvg) / overallAvg * 100).toFixed(1)
      }));
      
      const insight = problematicPeriods.length > 0
        ? `${problematicPeriods.length} período(s) com tempo de entrega acima do esperado. Piores: ${problematicPeriods.slice(0, 3).map(p => `${p.weekdayName} às ${p.hour}h (+${p.degradation}%)`).join(', ')}`
        : 'Tempo de entrega está dentro do esperado em todos os períodos';
      
      res.json({ 
        success: true, 
        data,
        overallAvg,
        problematicPeriods,
        insight
      });
    } catch (error) {
      console.error('Delivery degradation error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao analisar degradação de entrega' 
      });
    }
  }

  // Helper
  static getWeekdayName(weekday) {
    const names = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return names[parseInt(weekday) - 1] || '';
  }
}

export default InsightsController;