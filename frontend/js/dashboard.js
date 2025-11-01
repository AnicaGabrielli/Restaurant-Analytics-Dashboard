// ========== frontend/js/dashboard.js - CARREGAMENTO SEQUENCIAL OTIMIZADO ==========

const API_BASE = '/api';

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

// Delay helper para evitar esgotar pool
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Carregar dados do dashboard com filtros
 */
async function loadDashboard() {
    try {
        const queryString = buildFilterQueryString();
        const response = await fetch(`${API_BASE}/dashboard/overview?${queryString}`);
        const result = await response.json();
        
        if (result.success) {
            updateKPIs(result.data);
            updateCharts(result.data);
            updateComparison(result.data.comparison);
        } else {
            console.error('Erro ao carregar dashboard:', result.error);
            showToast('Erro ao carregar dashboard', 'danger');
        }
    } catch (error) {
        console.error('Erro de rede:', error);
        showToast('Erro ao carregar dados. Verifique sua conexão.', 'danger');
    }
}

function updateKPIs(data) {
    const { revenue, operationalMetrics, comparison } = data;
    
    document.getElementById('totalRevenue').textContent = formatCurrency(revenue.total_revenue);
    document.getElementById('totalSales').textContent = formatNumber(revenue.total_sales);
    document.getElementById('avgTicket').textContent = formatCurrency(revenue.avg_ticket);
    document.getElementById('avgProduction').textContent = 
        `${Math.round(operationalMetrics.production.avg_production_minutes || 0)} min`;

    if (comparison) {
        const revenueGrowth = parseFloat(comparison.growth);
        const salesGrowth = parseFloat(comparison.salesGrowth);

        const revenueGrowthHTML = `
            <i class="bi bi-arrow-${revenueGrowth >= 0 ? 'up' : 'down'} text-${revenueGrowth >= 0 ? 'success' : 'danger'}"></i>
            ${Math.abs(revenueGrowth).toFixed(1)}% vs período anterior
        `;

        const salesGrowthHTML = `
            <i class="bi bi-arrow-${salesGrowth >= 0 ? 'up' : 'down'} text-${salesGrowth >= 0 ? 'success' : 'danger'}"></i>
            ${Math.abs(salesGrowth).toFixed(1)}% vs período anterior
        `;

        document.getElementById('revenueGrowth').innerHTML = revenueGrowthHTML;
        document.getElementById('salesGrowth').innerHTML = salesGrowthHTML;
    }
}

function updateComparison(comparison) {
    if (!comparison) return;

    const growth = parseFloat(comparison.growth);
    const trend = growth >= 0 ? 'crescimento' : 'queda';
    const icon = growth >= 0 ? 'graph-up-arrow' : 'graph-down-arrow';
    const color = growth >= 0 ? 'success' : 'danger';

    let comparisonBar = document.getElementById('comparisonBar');
    if (!comparisonBar) {
        comparisonBar = document.createElement('div');
        comparisonBar.id = 'comparisonBar';
        document.querySelector('#overview').insertBefore(
            comparisonBar, 
            document.querySelector('#overview .row')
        );
    }

    comparisonBar.className = `alert alert-${color} d-flex justify-content-between align-items-center mb-4`;
    comparisonBar.innerHTML = `
        <span>
            <i class="bi bi-${icon}"></i>
            ${trend} de <strong>${Math.abs(growth).toFixed(1)}%</strong> em relação ao período anterior
            (${formatCurrency(comparison.previous.total_revenue)} → ${formatCurrency(comparison.current.total_revenue)})
        </span>
    `;
}

function updateCharts(data) {
    chartManager.createSalesTrendChart('salesTrendChart', data.salesByPeriod);
    chartManager.createChannelChart('channelChart', data.salesByChannel);
    chartManager.createTopProductsChart('topProductsChart', data.topProducts);
    chartManager.createTopItemsChart('topItemsChart', data.topItems);
}

async function loadSalesAnalytics() {
    try {
        const queryString = buildFilterQueryString();
        const response = await fetch(`${API_BASE}/analytics/sales?${queryString}`);
        const result = await response.json();
        
        if (result.success) {
            const { byHour, byWeekday, byStore } = result.data;
            
            chartManager.createHourlyChart('hourlyChart', byHour);
            chartManager.createWeekdayChart('weekdayChart', byWeekday);
            chartManager.createStoreChart('storeChart', byStore);
        } else {
            console.error('Erro em sales analytics:', result.error);
        }
    } catch (error) {
        console.error('Erro ao carregar análise de vendas:', error);
    }
}

async function loadProductAnalytics() {
    try {
        const queryString = buildFilterQueryString();
        const response = await fetch(`${API_BASE}/analytics/products?${queryString}`);
        const result = await response.json();
        
        if (result.success) {
            const { byCategory, mostCustomized } = result.data;
            
            chartManager.createCategoriesChart('categoriesChart', byCategory);
            chartManager.createCustomizedProductsChart('customizedProductsChart', mostCustomized);
        } else {
            console.error('Erro em product analytics:', result.error);
        }
    } catch (error) {
        console.error('Erro ao carregar análise de produtos:', error);
    }
}

async function loadCustomerAnalytics() {
    try {
        const queryString = buildFilterQueryString();
        const response = await fetch(`${API_BASE}/analytics/customers?${queryString}`);
        const result = await response.json();
        
        if (result.success) {
            const { retention, topCustomers, newVsReturning } = result.data;
            
            chartManager.createRetentionChart('retentionChart', retention);
            chartManager.createCustomerTypeChart('customerTypeChart', newVsReturning);
            
            updateTopCustomersTable(topCustomers);
        } else {
            console.error('Erro em customer analytics:', result.error);
        }
    } catch (error) {
        console.error('Erro ao carregar análise de clientes:', error);
    }
}

function updateTopCustomersTable(customers) {
    const tbody = document.querySelector('#topCustomersTable tbody');
    tbody.innerHTML = '';
    
    if (!customers || customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum cliente encontrado</td></tr>';
        return;
    }

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

async function loadDeliveryAnalytics() {
    try {
        const queryString = buildFilterQueryString();
        const response = await fetch(`${API_BASE}/analytics/delivery?${queryString}`);
        const result = await response.json();
        
        if (result.success) {
            const { byRegion, stats, topNeighborhoods } = result.data;
            
            document.getElementById('totalDeliveries').textContent = formatNumber(stats.total_deliveries);
            
            const avgDeliveryMinutes = stats.avg_delivery_minutes || 0;
            document.getElementById('avgDeliveryTime').textContent = `${Math.round(avgDeliveryMinutes)} min`;
            
            document.getElementById('avgDeliveryFee').textContent = formatCurrency(stats.avg_delivery_fee);
            document.getElementById('totalDeliveryRevenue').textContent = formatCurrency(stats.total_delivery_revenue);
            
            chartManager.createTopNeighborhoodsChart('topNeighborhoodsChart', topNeighborhoods);
            chartManager.createDeliveryPerformanceChart('deliveryPerformanceChart', byRegion);
        } else {
            console.error('Erro em delivery analytics:', result.error);
        }
    } catch (error) {
        console.error('Erro ao carregar análise de delivery:', error);
    }
}

async function loadCacheStats() {
    try {
        const response = await fetch(`${API_BASE}/stats/cache`);
        const result = await response.json();
        
        if (result.success) {
            const stats = result.data;
            document.getElementById('cacheStats').textContent = 
                `Cache: ${stats.size} entradas | Hit Rate: ${stats.hitRate}`;
        }
    } catch (error) {
        console.error('Erro ao carregar stats de cache:', error);
    }
}

/**
 * CRÍTICO: Refresh com CARREGAMENTO SEQUENCIAL para evitar esgotar pool
 */
async function refreshDashboard() {
    console.log('🔄 Iniciando refresh do dashboard (SEQUENCIAL)...');
    showLoading();
    
    try {
        console.log('📊 1/5 Carregando dashboard...');
        await loadDashboard();
        await delay(200); // Delay para liberar conexões
        
        console.log('📈 2/5 Carregando análise de vendas...');
        await loadSalesAnalytics();
        await delay(200);
        
        console.log('📦 3/5 Carregando análise de produtos...');
        await loadProductAnalytics();
        await delay(200);
        
        console.log('👥 4/5 Carregando análise de clientes...');
        await loadCustomerAnalytics();
        await delay(200);
        
        console.log('🚚 5/5 Carregando análise de entregas...');
        await loadDeliveryAnalytics();
        
        await loadCacheStats();
        
        console.log('✅ Dashboard carregado com sucesso!');
        showToast('Dashboard atualizado com sucesso!', 'success');
        
    } catch (error) {
        console.error('❌ Erro ao atualizar dashboard:', error);
        showToast('Erro ao atualizar dashboard', 'danger');
    } finally {
        hideLoading();
    }
}

function showToast(message, type = 'info') {
    document.querySelectorAll('.toast-notification').forEach(t => t.remove());
    
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} toast-notification position-fixed`;
    toast.style.cssText = 'top: 80px; right: 20px; z-index: 9999; min-width: 250px; animation: slideInRight 0.3s ease;';
    toast.innerHTML = `
        <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'danger' ? 'x-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const navbarHeight = document.querySelector('.navbar').offsetHeight;
            const filterBarHeight = document.querySelector('.filter-bar').offsetHeight;
            const targetPosition = target.offsetTop - navbarHeight - filterBarHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= (sectionTop - 200)) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

// Auto-refresh a cada 10 minutos (aumentado de 5)
let autoRefreshInterval = setInterval(() => {
    console.log('[Auto-refresh] Atualizando dashboard...');
    refreshDashboard();
}, 600000); // 10 minutos

window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando dashboard...');
    
    refreshDashboard();
    
    setInterval(loadCacheStats, 60000); // 1 minuto
});

window.refreshDashboard = refreshDashboard;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.performSearch = performSearch;
window.exportData = exportData;