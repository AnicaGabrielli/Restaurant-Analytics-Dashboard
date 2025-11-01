import Product from '../models/Product.js';

class ProductController {
  static async getTopProducts(req, res) {
    try {
      const filters = req.query;
      const limit = parseInt(req.query.limit) || 20;
      const data = await Product.getTopProducts(filters, limit);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Top products error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar produtos mais vendidos' 
      });
    }
  }

  static async getByCategory(req, res) {
    try {
      const filters = req.query;
      const data = await Product.getProductsByCategory(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Products by category error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar produtos por categoria' 
      });
    }
  }

  static async getTopCustomizations(req, res) {
    try {
      const filters = req.query;
      const limit = parseInt(req.query.limit) || 20;
      const data = await Product.getTopCustomizations(filters, limit);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Top customizations error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar customizações mais vendidas' 
      });
    }
  }

  static async getPerformanceByChannel(req, res) {
    try {
      const filters = req.query;
      const data = await Product.getProductPerformanceByChannel(filters);
      
      res.json({ success: true, data });
    } catch (error) {
      console.error('Product performance by channel error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar performance de produtos por canal' 
      });
    }
  }
}

export default ProductController;