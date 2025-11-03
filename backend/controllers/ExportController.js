import { Parser } from 'json2csv';

class ExportController {
  // Exportar dados como CSV
  static async exportCSV(req, res) {
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
      console.error('Export CSV error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao exportar CSV' 
      });
    }
  }

  // Endpoint para receber dados HTML do PDF gerado no frontend
  static async exportPDF(req, res) {
    try {
      const { title, content } = req.body;
      
      if (!content) {
        return res.status(400).json({ 
          success: false, 
          error: 'Conteúdo inválido para exportação PDF' 
        });
      }

      // O PDF será gerado no frontend usando jsPDF
      // Este endpoint serve apenas para validação ou log
      res.json({ 
        success: true,
        message: 'PDF preparado para download'
      });
    } catch (error) {
      console.error('Export PDF error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao preparar PDF' 
      });
    }
  }
}

export default ExportController;