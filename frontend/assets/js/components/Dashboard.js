import ApiService from '../services/ApiService.js';
import { Filters } from './Filters.js';
import { Charts } from './Charts.js';
import { PDFExport } from './PDFExport.js';
import { formatCurrency, formatNumber, downloadCSV } from '../utils/helpers.js';

export class Dashboard {
  constructor() {
    this.filters = new Filters();
    this.charts = new Charts();
    this.pdfExport = new PDFExport();
    this.topProductsData = [];
  }

  async init() {
    await this.filters.init();
    await this.loadDashboard();
    this.setupEventListeners();
  }

  setupEventListeners() {
    document.addEventListener('filtersApplied', async (e) => {
      await this.loadDashboard();
    });

    const exportBtn = document.getElementById('exportTopProducts');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        this.exportTopProducts();
      });
    }

    const exportPdfBtn = document.getElementById('exportDashboardPDF');
    if (exportPdfBtn) {
      exportPdfBtn.addEventListener('click', () => {
        this.pdfExport.exportDashboardToPDF('Dashboard_Executivo');
      });
    }
  }

  async loadDashboard() {
    try {
      const filters = this.filters.getFilters();
      const response = await ApiService.getDashboard(filters);
      
      if (response.success) {
        this.updateMetrics(response.data.metrics);
        this.updateTopProducts(response.data.topProducts);
        this.charts.createHourlyChart(response.data.hourlyDistribution);
        this.charts.createChannelChart(response.data.salesByChannel);
        
        // Mostrar insights
        if (response.data.insights) {
          this.showInsights(response.data.insights);
        }
      } else {
        console.error('Dashboard response not successful:', response);
        this.showError('Erro ao carregar dashboard');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      this.showError('Erro ao carregar dashboard: ' + error.message);
    }
  }

  updateMetrics(metrics) {
    const totalRevenue = document.getElementById('totalRevenue');
    const totalSales = document.getElementById('totalSales');
    const avgTicket = document.getElementById('avgTicket');
    const cancelledSales = document.getElementById('cancelledSales');
    const cancellationRate = document.getElementById('cancellationRate');

    if (totalRevenue) totalRevenue.textContent = formatCurrency(metrics.total_revenue);
    if (totalSales) totalSales.textContent = formatNumber(metrics.total_sales);
    if (avgTicket) avgTicket.textContent = formatCurrency(metrics.avg_ticket);
    if (cancelledSales) cancelledSales.textContent = formatNumber(metrics.cancelled_sales);
    if (cancellationRate) cancellationRate.textContent = `${parseFloat(metrics.cancellation_rate || 0).toFixed(1)}%`;
  }

  updateTopProducts(products) {
    const tbody = document.querySelector('#topProductsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    if (!products || products.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum produto encontrado</td></tr>';
      return;
    }
    
    products.forEach((product, index) => {
      const row = tbody.insertRow();
      const marginClass = parseFloat(product.profit_margin_percent || 0) < 20 ? 'text-danger' : 
                         parseFloat(product.profit_margin_percent || 0) < 30 ? 'text-warning' : 
                         'text-success';
      
      row.innerHTML = `
        <td><strong>${index + 1}</strong></td>
        <td>${product.product_name}</td>
        <td>${product.category_name || 'N/A'}</td>
        <td>${formatNumber(product.total_quantity)}</td>
        <td>${formatCurrency(product.total_revenue)}</td>
        <td><span class="${marginClass} fw-bold">${parseFloat(product.profit_margin_percent || 0).toFixed(1)}%</span></td>
      `;
    });

    this.topProductsData = products;
  }

  showInsights(insights) {
    const container = document.getElementById('insightsAlerts');
    if (!container) return;

    container.innerHTML = '';

    if (insights.hasHighCancellation) {
      container.innerHTML += `
        <div class="alert alert-warning alert-dismissible fade show" role="alert">
          <i class="fas fa-exclamation-triangle me-2"></i>
          <strong>Atenção!</strong> Taxa de cancelamento acima de 10%. Verifique possíveis problemas operacionais.
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
    }

    if (insights.topChannel) {
      container.innerHTML += `
        <div class="alert alert-info alert-dismissible fade show" role="alert">
          <i class="fas fa-info-circle me-2"></i>
          Canal com melhor performance: <strong>${insights.topChannel}</strong>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
    }

    if (insights.peakHour !== null && insights.peakHour !== undefined) {
      container.innerHTML += `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
          <i class="fas fa-clock me-2"></i>
          Horário de pico: <strong>${insights.peakHour}:00 - ${insights.peakHour}:59</strong>
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
    }
  }

  exportTopProducts() {
    if (!this.topProductsData || this.topProductsData.length === 0) {
      alert('Não há dados para exportar');
      return;
    }

    const exportData = this.topProductsData.map((p, i) => ({
      'Posição': i + 1,
      'Produto': p.product_name,
      'Categoria': p.category_name || 'N/A',
      'Quantidade': p.total_quantity,
      'Faturamento': p.total_revenue,
      'Margem %': parseFloat(p.profit_margin_percent || 0).toFixed(1)
    }));

    downloadCSV(exportData, 'top_produtos_dashboard');
  }

  showError(message) {
    const container = document.getElementById('insightsAlerts');
    if (container) {
      container.innerHTML = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
          <i class="fas fa-exclamation-circle me-2"></i>
          ${message}
          <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
      `;
    }
  }
}

export default Dashboard;