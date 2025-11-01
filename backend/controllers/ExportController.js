import { Parser } from 'json2csv';

class ExportController {
  static async exportData(req, res) {
    try {
      const { data, filename } = req.body;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'Dados inválidos para exportação' 
        });
      }

      const parser = new Parser();
      const csv = parser.parse(data);
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename || 'export'}.csv"`);
      res.send('\ufeff' + csv);
    } catch (error) {
      console.error('Export error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao exportar dados' 
      });
    }
  }
}

export default ExportController;