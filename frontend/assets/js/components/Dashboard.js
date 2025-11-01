import ApiService from '../services/ApiService.js';
import { Filters } from './Filters.js';
import { Charts } from './Charts.js';
import { formatCurrency, formatNumber, downloadCSV } from '../utils/helpers.js';

export class Dashboard {
  constructor() {
    this.filters = new Filters();
    this.charts = new Charts();
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
  }

  async loadDashboard() {
    try {
      console.log('Loading dashboard...');
      const filters = this.filters.getFilters();
      console.log('Filters:', filters);
      
      const response = await ApiService.getDashboard(filters);
      console.log('Dashboard response:', response);
      
      if (response.success) {
        this.updateMetrics(response.data.metrics);
        this.updateTopProducts(response.data.topProducts);
        this.charts.createHourlyChart(response.data.hourlyDistribution);
        this.charts.createChannelChart(response.data.salesByChannel);
      } else {
        console.error('Dashboard response not successful:', response);
        alert('Erro: Resposta da API não foi bem-sucedida');
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      alert('Erro ao carregar dashboard: ' + error.message);
    }
  }

  updateMetrics(metrics) {
    const totalRevenue = document.getElementById('totalRevenue');
    const totalSales = document.getElementById('totalSales');
    const avgTicket = document.getElementById('avgTicket');
    const cancelledSales = document.getElementById('cancelledSales');

    if (totalRevenue) totalRevenue.textContent = formatCurrency(metrics.total_revenue);
    if (totalSales) totalSales.textContent = formatNumber(metrics.total_sales);
    if (avgTicket) avgTicket.textContent = formatCurrency(metrics.avg_ticket);
    if (cancelledSales) cancelledSales.textContent = formatNumber(metrics.cancelled_sales);
  }

  updateTopProducts(products) {
    const tbody = document.querySelector('#topProductsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    
    products.forEach((product, index) => {
      const row = tbody.insertRow();
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${product.product_name}</td>
        <td>${product.category_name || 'N/A'}</td>
        <td>${formatNumber(product.total_quantity)}</td>
        <td>${formatCurrency(product.total_revenue)}</td>
        <td>${formatCurrency(product.avg_price)}</td>
      `;
    });

    this.topProductsData = products;
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
      'Preço Médio': p.avg_price
    }));

    downloadCSV(exportData, 'top_produtos');
  }
}

export default Dashboard;