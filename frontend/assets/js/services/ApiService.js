class ApiService {
  constructor() {
    this.baseUrl = '/api';
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${this.baseUrl}${endpoint}?${queryString}` : `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ===== DASHBOARD =====
  async getDashboard(filters) {
    return this.get('/dashboard', filters);
  }

  // ===== SALES =====
  async getSalesByPeriod(filters) {
    return this.get('/sales/period', filters);
  }

  async getSalesByChannel(filters) {
    return this.get('/sales/channel', filters);
  }

  async getSalesByStore(filters) {
    return this.get('/sales/store', filters);
  }

  async getHourlyDistribution(filters) {
    return this.get('/sales/hourly', filters);
  }

  async getWeekdayDistribution(filters) {
    return this.get('/sales/weekday', filters);
  }

  async getDeliveryPerformance(filters) {
    return this.get('/sales/delivery', filters);
  }

  // ===== PRODUCTS =====
  async getTopProducts(filters) {
    return this.get('/products/top', filters);
  }

  async getProductsByCategory(filters) {
    return this.get('/products/category', filters);
  }

  async getTopCustomizations(filters) {
    return this.get('/products/customizations', filters);
  }

  async getProductPerformanceByChannel(filters) {
    return this.get('/products/channel-performance', filters);
  }

  async getLowMarginProducts(filters) {
    return this.get('/products/low-margin', filters);
  }

  async getProductsByDayAndHour(filters) {
    return this.get('/products/by-day-hour', filters);
  }

  // ===== CUSTOMERS =====
  async getCustomerRFM(filters) {
    return this.get('/customers/rfm', filters);
  }

  async getChurnRisk(filters) {
    return this.get('/customers/churn', filters);
  }

  async getLTVBySegment(filters) {
    return this.get('/customers/ltv', filters);
  }

  async getTopCustomers(filters) {
    return this.get('/customers/top', filters);
  }

  async getPurchaseFrequency(filters) {
    return this.get('/customers/frequency', filters);
  }

  async getNewCustomers(filters) {
    return this.get('/customers/new', filters);
  }

  async getRetentionRate(filters) {
    return this.get('/customers/retention', filters);
  }

  // ===== PERFORMANCE =====
  async getDeliveryTimeAnalysis(filters) {
    return this.get('/performance/delivery-time', filters);
  }

  async getDeliveryByRegion(filters) {
    return this.get('/performance/delivery-region', filters);
  }

  async getStoreEfficiency(filters) {
    return this.get('/performance/store-efficiency', filters);
  }

  async getChannelPerformance(filters) {
    return this.get('/performance/channel', filters);
  }

  async getPeakHours(filters) {
    return this.get('/performance/peak-hours', filters);
  }

  async getCancellationAnalysis(filters) {
    return this.get('/performance/cancellation', filters);
  }

  async getTicketComparison(filters) {
    return this.get('/performance/ticket-comparison', filters);
  }

  async getOperationalCapacity(filters) {
    return this.get('/performance/capacity', filters);
  }

  // ===== INSIGHTS =====
  async getProductByChannelDayHour(filters) {
    return this.get('/insights/product-by-channel-day-hour', filters);
  }

  async getTicketTrendAnalysis(filters) {
    return this.get('/insights/ticket-trend', filters);
  }

  async getLowMarginInsights(filters) {
    return this.get('/insights/low-margin', filters);
  }

  async getDeliveryDegradation(filters) {
    return this.get('/insights/delivery-degradation', filters);
  }

  // ===== FILTERS =====
  async getStores() {
    return this.get('/stores');
  }

  async getChannels() {
    return this.get('/channels');
  }

  async getCategories() {
    return this.get('/categories');
  }

  // ===== EXPORT =====
  async exportCSV(data, filename) {
    return this.post('/export/csv', { data, filename });
  }

  async exportPDF(title, content) {
    return this.post('/export/pdf', { title, content });
  }

  // ===== HEALTH =====
  async healthCheck() {
    return this.get('/health');
  }
}

export default new ApiService();