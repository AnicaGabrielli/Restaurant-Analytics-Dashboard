export class PDFExport {
  constructor() {
    this.loadLibraries();
  }

  async loadLibraries() {
    // jsPDF e html2canvas serão carregados via CDN no HTML
    this.jsPDF = window.jspdf?.jsPDF;
    this.html2canvas = window.html2canvas;
  }

  async exportDashboardToPDF(title = 'Dashboard', element = document.body) {
    try {
      if (!this.jsPDF || !this.html2canvas) {
        alert('Bibliotecas de PDF não carregadas. Recarregue a página.');
        return;
      }

      // Mostrar loading
      this.showLoading();

      // Configurar PDF
      const pdf = new this.jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      // Adicionar título e data
      pdf.setFontSize(20);
      pdf.setTextColor(216, 67, 21); // Cor primary
      pdf.text(title, margin, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, 28);

      // Capturar elementos visuais
      const cards = document.querySelectorAll('.metric-card, .chart-card, .card');
      let yPosition = 35;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        
        try {
          const canvas = await this.html2canvas(card, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
          });

          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - (margin * 2);
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // Adicionar nova página se necessário
          if (yPosition + imgHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (err) {
          console.error('Erro ao capturar elemento:', err);
        }
      }

      // Salvar PDF
      const filename = `${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
      pdf.save(filename);

      this.hideLoading();
      this.showSuccess('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      this.hideLoading();
      alert('Erro ao exportar PDF. Tente novamente.');
    }
  }

  async exportTableToPDF(title, tableId) {
    try {
      if (!this.jsPDF) {
        alert('Biblioteca de PDF não carregada. Recarregue a página.');
        return;
      }

      this.showLoading();

      const pdf = new this.jsPDF('p', 'mm', 'a4');
      const table = document.getElementById(tableId);
      
      if (!table) {
        throw new Error('Tabela não encontrada');
      }

      // Extrair dados da tabela
      const rows = [];
      const headers = [];
      
      // Cabeçalhos
      const headerCells = table.querySelectorAll('thead th');
      headerCells.forEach(cell => headers.push(cell.textContent.trim()));
      
      // Dados
      const bodyRows = table.querySelectorAll('tbody tr');
      bodyRows.forEach(row => {
        const rowData = [];
        const cells = row.querySelectorAll('td');
        cells.forEach(cell => rowData.push(cell.textContent.trim()));
        rows.push(rowData);
      });

      // Adicionar título
      pdf.setFontSize(16);
      pdf.setTextColor(216, 67, 21);
      pdf.text(title, 14, 20);
      
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

      // Adicionar tabela usando autoTable se disponível
      if (pdf.autoTable) {
        pdf.autoTable({
          head: [headers],
          body: rows,
          startY: 35,
          theme: 'striped',
          headStyles: {
            fillColor: [216, 67, 21],
            textColor: 255,
            fontSize: 10,
            fontStyle: 'bold'
          },
          styles: {
            fontSize: 9,
            cellPadding: 3
          }
        });
      }

      const filename = `${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
      pdf.save(filename);

      this.hideLoading();
      this.showSuccess('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar tabela:', error);
      this.hideLoading();
      alert('Erro ao exportar PDF. Tente novamente.');
    }
  }

  async exportChartToPDF(title, canvasId) {
    try {
      if (!this.jsPDF) {
        alert('Biblioteca de PDF não carregada.');
        return;
      }

      this.showLoading();

      const pdf = new this.jsPDF('l', 'mm', 'a4'); // Landscape
      const canvas = document.getElementById(canvasId);
      
      if (!canvas) {
        throw new Error('Gráfico não encontrado');
      }

      const imgData = canvas.toDataURL('image/png');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      // Título
      pdf.setFontSize(16);
      pdf.setTextColor(216, 67, 21);
      pdf.text(title, margin, 20);

      // Imagem do gráfico
      const imgWidth = pageWidth - (margin * 2);
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', margin, 30, imgWidth, imgHeight);

      const filename = `${title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`;
      pdf.save(filename);

      this.hideLoading();
      this.showSuccess('Gráfico exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar gráfico:', error);
      this.hideLoading();
      alert('Erro ao exportar gráfico.');
    }
  }

  showLoading() {
    const loader = document.createElement('div');
    loader.id = 'pdfLoader';
    loader.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 9999; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Gerando PDF...</span>
          </div>
          <p style="margin-top: 15px; color: #333;">Gerando PDF...</p>
        </div>
      </div>
    `;
    document.body.appendChild(loader);
  }

  hideLoading() {
    const loader = document.getElementById('pdfLoader');
    if (loader) {
      loader.remove();
    }
  }

  showSuccess(message) {
    const toast = document.createElement('div');
    toast.className = 'alert alert-success';
    toast.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; min-width: 250px;';
    toast.innerHTML = `
      <i class="fas fa-check-circle me-2"></i>${message}
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
  }
}

export default PDFExport;