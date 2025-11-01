// ========== frontend/js/dashboard.js - ATUALIZADO ==========

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

// Carregar dados do dashboard com filtros
async function loadDashboard() {
    showLoading();
    
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
        }
    } catch (error) {
        console.error('Erro de rede:', error);
        alert('Erro ao carregar dados. Verifique sua conexão.');
    } finally {
        hideLoading();
    }
}

// Atualizar KPIs com crescimento
function updateKPIs(data) {
    const { revenue, operationalMetrics, comparison } = data;
    
    // KPIs principais
    document.getElementById('totalRevenue').textContent = formatCurrency(revenue.total_revenue);
    document.getElementById('totalSales').textContent = formatNumber(revenue.total_sales);
    document.getElementById('avgTicket').textContent = formatCurrency(revenue.avg_ticket);
    document.getElementById('avgProduction').textContent = 
        `${Math.round(operationalMetrics.production.avg_production_minutes || 0)} min`;

    // Indicadores de crescimento
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

// Atualizar comparação
function updateComparison(comparison) {
    if (!comparison) return;

    const comparisonBar = document.getElementById('comparisonBar');
    const comparisonText = document.getElementById('comparisonText');

    const growth = parseFloat(comparison.growth);
    const trend = growth >= 0 ? 'crescimento' : 'queda';
    const icon = growth >= 0 ? 'graph-up-arrow' : 'graph-down-arrow';
    const color = growth >= 0 ? 'success' : 'danger';

    comparisonText.innerHTML = `
        <i class="bi bi-${icon} text-${color}"></i>
        ${trend} de <strong>${Math.abs(growth).toFixed(1)}%</strong> em relação ao período anterior
        (R$ ${formatCurrency(comparison.previous.total_revenue)} → R$ ${formatCurrency(comparison.current.total_revenue)})
    `;

    comparisonBar.style.display = 'flex';
    comparisonBar.className = `alert alert-${color} d-flex justify-content-between align-items-center mb-4`;
}

// Atualizar gráficos principais
function updateCharts(data) {
    chartManager.createSalesTrendChart('salesTrendChart', data.salesByPeriod);
    chartManager.createChannelChart('channelChart', data.salesByChannel);
    chartManager.createTopProductsChart('topProductsChart', data.topProducts);
    chartManager.createTopItemsChart('topItemsChart', data.topItems);
}

// Carregar análises de vendas com filtros
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
        }
    } catch (error) {
        console.error('Erro ao carregar análise de vendas:', error);
    }
}

// Carregar análises de produtos com filtros
async function loadProductAnalytics() {
    try {
        const queryString = buildFilterQueryString();
        const response = await fetch(`${API_BASE}/analytics/products?${queryString}`);
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

// Carregar análises de clientes com filtros
async function loadCustomerAnalytics() {
    try {
        const queryString = buildFilterQueryString();
        const response = await fetch(`${API_BASE}/analytics/customers?${queryString}`);
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

// Carregar análises de delivery com filtros
async function loadDeliveryAnalytics() {
    try {
        const queryString = buildFilterQueryString();
        const response = await fetch(`${API_BASE}/analytics/delivery?${queryString}`);
        const result = await response.json();
        
        if (result.success) {
            const { byRegion, stats, topNeighborhoods } = result.data;
            
            // Atualizar KPIs de delivery
            document.getElementById('totalDeliveries').textContent = formatNumber(stats.total_deliveries);
            
            const avgDeliveryMinutes = stats.avg_delivery_minutes || 0;
            document.getElementById('avgDeliveryTime').textContent = `${Math.round(avgDeliveryMinutes)} min`;
            
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

// Carrega estatísticas de cache
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

// Refresh completo
async function refreshDashboard() {
    showLoading();
    
    try {
        await Promise.all([
            loadDashboard(),
            loadSalesAnalytics(),
            loadProductAnalytics(),
            loadCustomerAnalytics(),
            loadDeliveryAnalytics(),
            loadCacheStats()
        ]);
    } catch (error) {
        console.error('Erro ao atualizar dashboard:', error);
    } finally {
        hideLoading();
    }
}

// Smooth scroll para navegação
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

// Atualiza link ativo na navegação
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    let current = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
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

// Auto-refresh a cada 5 minutos
let autoRefreshInterval = setInterval(() => {
    console.log('[Auto-refresh] Atualizando dashboard...');
    refreshDashboard();
}, 300000); // 5 minutos

// Limpa interval ao sair da página
window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});

// Inicializar ao carregar página
document.addEventListener('DOMContentLoaded', () => {
    // Carrega dashboard inicial
    refreshDashboard();
    
    // Atualiza stats de cache periodicamente
    setInterval(loadCacheStats, 60000); // 1 minuto
});

// Expõe funções globais necessárias
window.refreshDashboard = refreshDashboard;
window.applyFilters = applyFilters;
window.clearFilters = clearFilters;
window.performSearch = performSearch;
window.exportData = exportData;