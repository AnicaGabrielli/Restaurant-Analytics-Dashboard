import Customer from '../models/Customer.js';

class CustomerController {
  static async getRFMAnalysis(req, res) {
    try {
      const filters = req.query;
      const data = await Customer.getRFMAnalysis(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('RFM analysis error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar análise RFM' 
      });
    }
  }

  static async getChurnRisk(req, res) {
    try {
      const filters = req.query;
      const data = await Customer.getChurnRiskCustomers(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Churn risk error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar clientes em risco' 
      });
    }
  }

  static async getLTVBySegment(req, res) {
    try {
      const filters = req.query;
      const data = await Customer.getLTVBySegment(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('LTV by segment error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar LTV por segmento' 
      });
    }
  }

  static async getTopCustomers(req, res) {
    try {
      const filters = req.query;
      const limit = parseInt(req.query.limit) || 20;
      const data = await Customer.getTopCustomers(filters, limit);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Top customers error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar top clientes' 
      });
    }
  }

  static async getPurchaseFrequency(req, res) {
    try {
      const filters = req.query;
      const data = await Customer.getPurchaseFrequency(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Purchase frequency error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar frequência de compra' 
      });
    }
  }

  static async getNewCustomers(req, res) {
    try {
      const filters = req.query;
      const data = await Customer.getNewCustomers(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('New customers error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar novos clientes' 
      });
    }
  }

  static async getRetentionRate(req, res) {
    try {
      const filters = req.query;
      const data = await Customer.getRetentionRate(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Retention rate error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar taxa de retenção' 
      });
    }
  }
}

export default CustomerController;