class ApiService {
  constructor() {
    this.baseUrl = '/api';
  }

  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${this.baseUrl}${endpoint}?${queryString}` : `${this.baseUrl}${endpoint}`;
    
    console.log('API GET:', url);
    
    try {
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);
      return data;
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

  async getDashboard(filters) {
    return this.get('/dashboard', filters);
  }

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

  async getStores() {
    return this.get('/stores');
  }

  async getChannels() {
    return this.get('/channels');
  }

  async getCategories() {
    return this.get('/categories');
  }

  async exportData(data, filename) {
    return this.post('/export', { data, filename });
  }
}

export default new ApiService();