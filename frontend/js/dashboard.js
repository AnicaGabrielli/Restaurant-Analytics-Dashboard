// ========== frontend/js/dashboard.js ==========

const API_BASE = '/api';

// Utilitários
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
};

const showLoading = () => {
    document.getElementById('loadingOverlay').classList.remove('hidden');
};

const hideLoading = () => {
    document.getElementById('loadingOverlay').classList.add('hidden');
};

// Carregar dados do dashboard
async function loadDashboard() {
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/dashboard/overview`);
        const result = await response.json();
        
        if (result.success) {
            updateKPIs(result.data);
            updateCharts(result.data);
        } else {
            console.error('Erro ao carregar dashboard:', result.error);
        }
    } catch (error) {
        console.error('Erro de rede:', error);
    } finally {
        hideLoading();
    }
}

// Atualizar KPIs
function updateKPIs(data) {
    const { revenue, operationalMetrics } = data;
    
    document.getElementById('totalRevenue').textContent = formatCurrency(revenue.total_revenue);
    document.getElementById('totalSales').textContent = formatNumber(revenue.total_sales);
    document.getElementById('avgTicket').textContent = formatCurrency(revenue.avg_ticket);
    document.getElementById('avgProduction').textContent = 
        `${Math.round(operationalMetrics.production.avg_production_minutes || 0)} min`;
}

// Atualizar gráficos principais
function updateCharts(data) {
    chartManager.createSalesTrendChart('salesTrendChart', data.salesByPeriod);
    chartManager.createChannelChart('channelChart', data.salesByChannel);
    chartManager.createTopProductsChart('topProductsChart', data.topProducts);
    chartManager.createTopItemsChart('topItemsChart', data.topItems);
}

// Carregar análises de vendas
async function loadSalesAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/analytics/sales`);
        const result = await response.json();
        
        if (result.success) {
            const { byHour, byWeekday, byStore } = result.data;
            
            chartManager.createHourlyChart('hourlyChart', byHour);
            chartManager.createWeekdayChart('weekdayChart', byWeekday);
            chartManager.createStoreChart('storeChart', byStore);
        }
    } catch (error) {
        console.error('Erro ao carregar análise de vendas:', error);
    }
}

// Carregar análises de produtos
async function loadProductAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/analytics/products`);
        const result = await response.json();
        
        if (result.success) {
            const { byCategory, mostCustomized } = result.data;
            
            chartManager.createCategoriesChart('categoriesChart', byCategory);
            chartManager.createCustomizedProductsChart('customizedProductsChart', mostCustomized);
        }
    } catch (error) {
        console.error('Erro ao carregar análise de produtos:', error);
    }
}

// Carregar análises de clientes
async function loadCustomerAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/analytics/customers`);
        const result = await response.json();
        
        if (result.success) {
            const { retention, topCustomers, newVsReturning } = result.data;
            
            chartManager.createRetentionChart('retentionChart', retention);
            chartManager.createCustomerTypeChart('customerTypeChart', newVsReturning);
            
            // Atualizar tabela
            updateTopCustomersTable(topCustomers);
        }
    } catch (error) {
        console.error('Erro ao carregar análise de clientes:', error);
    }
}

// Atualizar tabela de top clientes
function updateTopCustomersTable(customers) {
    const tbody = document.querySelector('#topCustomersTable tbody');
    tbody.innerHTML = '';
    
    customers.forEach((customer, index) => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td><strong>${index + 1}</strong></td>
            <td>${customer.customer_name}</td>
            <td>${customer.email || 'N/A'}</td>
            <td>${formatNumber(customer.total_purchases)}</td>
            <td>${formatCurrency(customer.total_spent)}</td>
            <td>${formatCurrency(customer.avg_ticket)}</td>
            <td>${new Date(customer.last_purchase).toLocaleDateString('pt-BR')}</td>
        `;
    });
}

// Carregar análises de delivery
async function loadDeliveryAnalytics() {
    try {
        const response = await fetch(`${API_BASE}/analytics/delivery`);
        const result = await response.json();
        
        if (result.success) {
            const { byRegion, stats, topNeighborhoods } = result.data;
            
            // Atualizar KPIs de delivery
            document.getElementById('totalDeliveries').textContent = formatNumber(stats.total_deliveries);
            document.getElementById('avgDeliveryTime').textContent = 
                `${Math.round(stats.avg_delivery_minutes || 0)} min`;
            document.getElementById('avgDeliveryFee').textContent = formatCurrency(stats.avg_delivery_fee);
            document.getElementById('totalDeliveryRevenue').textContent = formatCurrency(stats.total_delivery_revenue);
            
            // Gráficos
            chartManager.createTopNeighborhoodsChart('topNeighborhoodsChart', topNeighborhoods);
            chartManager.createDeliveryPerformanceChart('deliveryPerformanceChart', byRegion);
        }
    } catch (error) {
        console.error('Erro ao carregar análise de delivery:', error);
    }
}

// Refresh completo
async function refreshDashboard() {
    showLoading();
    
    await Promise.all([
        loadDashboard(),
        loadSalesAnalytics(),
        loadProductAnalytics(),
        loadCustomerAnalytics(),
        loadDeliveryAnalytics()
    ]);
    
    hideLoading();
}

// Inicializar ao carregar página
document.addEventListener('DOMContentLoaded', () => {
    refreshDashboard();
});

// Smooth scroll para navegação
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});