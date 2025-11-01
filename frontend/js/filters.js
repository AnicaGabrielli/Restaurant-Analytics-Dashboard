// ========== frontend/js/filters.js - COM EXPANDIR/OCULTAR ==========

// Estado global de filtros
const filterState = {
    period: 'last30days',
    startDate: null,
    endDate: null,
    channelIds: [],
    storeIds: [],
    status: 'COMPLETED',
    categoryId: null,
    minAmount: null,
    maxAmount: null
};

// Opções disponíveis
let filterOptions = {
    stores: [],
    channels: [],
    categories: [],
    statuses: []
};

// Estado de expansão dos filtros
let filtersExpanded = true;

/**
 * Inicializa sistema de filtros
 */
async function initFilters() {
    try {
        // Carrega opções de filtros
        const response = await fetch(`${API_BASE}/filters/options`);
        const result = await response.json();
        
        if (result.success) {
            filterOptions = result.data;
            populateFilterSelects();
        }
    } catch (error) {
        console.error('Erro ao carregar opções de filtros:', error);
    }

    // Event listeners
    document.getElementById('filterPeriod').addEventListener('change', handlePeriodChange);
    document.getElementById('searchInput').addEventListener('keyup', handleSearchKeyup);
    
    // Botão de expandir/ocultar
    setupToggleButton();
}

/**
 * Configura botão de expandir/ocultar filtros
 */
function setupToggleButton() {
    const filterBar = document.querySelector('.filter-bar');
    
    // Cria botão toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn btn-sm btn-outline-secondary position-absolute';
    toggleBtn.style.cssText = 'top: 10px; right: 10px; z-index: 1001;';
    toggleBtn.innerHTML = '<i class="bi bi-chevron-up"></i>';
    toggleBtn.title = 'Expandir/Ocultar Filtros';
    toggleBtn.onclick = toggleFilters;
    
    // Adiciona botão ao filter-bar
    filterBar.style.position = 'relative';
    filterBar.appendChild(toggleBtn);
    
    // Salva referência global
    window.filterToggleBtn = toggleBtn;
}

/**
 * Alterna expansão dos filtros
 */
function toggleFilters() {
    const filterContent = document.querySelector('.filter-bar .container-fluid');
    const toggleBtn = window.filterToggleBtn;
    
    filtersExpanded = !filtersExpanded;
    
    if (filtersExpanded) {
        // Expandir
        filterContent.style.display = 'block';
        toggleBtn.innerHTML = '<i class="bi bi-chevron-up"></i>';
        toggleBtn.title = 'Ocultar Filtros';
        
        // Animação suave
        filterContent.style.opacity = '0';
        filterContent.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            filterContent.style.transition = 'all 0.3s ease';
            filterContent.style.opacity = '1';
            filterContent.style.transform = 'translateY(0)';
        }, 10);
    } else {
        // Ocultar
        filterContent.style.transition = 'all 0.3s ease';
        filterContent.style.opacity = '0';
        filterContent.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            filterContent.style.display = 'none';
            toggleBtn.innerHTML = '<i class="bi bi-chevron-down"></i>';
            toggleBtn.title = 'Expandir Filtros';
        }, 300);
    }
    
    // Salva preferência no localStorage
    localStorage.setItem('filtersExpanded', filtersExpanded);
}

/**
 * Restaura estado de expansão do localStorage
 */
function restoreFilterState() {
    const saved = localStorage.getItem('filtersExpanded');
    if (saved !== null) {
        filtersExpanded = saved === 'true';
        if (!filtersExpanded) {
            // Aplica estado oculto sem animação
            const filterContent = document.querySelector('.filter-bar .container-fluid');
            const toggleBtn = window.filterToggleBtn;
            
            filterContent.style.display = 'none';
            toggleBtn.innerHTML = '<i class="bi bi-chevron-down"></i>';
            toggleBtn.title = 'Expandir Filtros';
        }
    }
}

/**
 * Popula selects de filtros
 */
function populateFilterSelects() {
    // Canais
    const channelsSelect = document.getElementById('filterChannels');
    channelsSelect.innerHTML = '';
    filterOptions.channels.forEach(channel => {
        const option = document.createElement('option');
        option.value = channel.id;
        option.textContent = `${channel.name} (${channel.type === 'P' ? 'Presencial' : 'Delivery'})`;
        channelsSelect.appendChild(option);
    });

    // Lojas
    const storesSelect = document.getElementById('filterStores');
    storesSelect.innerHTML = '';
    filterOptions.stores.forEach(store => {
        const option = document.createElement('option');
        option.value = store.id;
        option.textContent = `${store.name} - ${store.city}`;
        storesSelect.appendChild(option);
    });
}

/**
 * Manipula mudança de período
 */
function handlePeriodChange(e) {
    const period = e.target.value;
    const customDates = document.querySelectorAll('.custom-dates');
    
    if (period === 'custom') {
        customDates.forEach(el => {
            el.style.display = 'block';
            el.style.animation = 'slideIn 0.3s ease';
        });
    } else {
        customDates.forEach(el => {
            el.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                el.style.display = 'none';
            }, 300);
        });
    }
}

/**
 * Aplica filtros selecionados
 */
async function applyFilters() {
    // Coleta valores dos filtros
    const period = document.getElementById('filterPeriod').value;
    
    filterState.period = period !== 'custom' ? period : null;
    filterState.startDate = period === 'custom' ? document.getElementById('filterStartDate').value : null;
    filterState.endDate = period === 'custom' ? document.getElementById('filterEndDate').value : null;
    
    // Validação de datas
    if (period === 'custom') {
        if (!filterState.startDate || !filterState.endDate) {
            alert('Por favor, selecione as datas de início e fim');
            return;
        }
        if (new Date(filterState.startDate) > new Date(filterState.endDate)) {
            alert('Data de início não pode ser maior que data de fim');
            return;
        }
    }
    
    // Canais (múltipla seleção)
    const channelsSelect = document.getElementById('filterChannels');
    filterState.channelIds = Array.from(channelsSelect.selectedOptions)
        .map(opt => parseInt(opt.value))
        .filter(v => !isNaN(v));
    
    // Lojas (múltipla seleção)
    const storesSelect = document.getElementById('filterStores');
    filterState.storeIds = Array.from(storesSelect.selectedOptions)
        .map(opt => parseInt(opt.value))
        .filter(v => !isNaN(v));
    
    // Status
    const status = document.getElementById('filterStatus').value;
    filterState.status = status || 'COMPLETED';

    console.log('✅ Filtros aplicados:', filterState);

    // Atualiza badges de filtros ativos
    updateActiveFiltersBadges();

    // Recarrega dashboard com filtros
    await refreshDashboard();
    
    // Feedback visual
    showToast('Filtros aplicados com sucesso!', 'success');
}

/**
 * Limpa todos os filtros
 */
async function clearFilters() {
    filterState.period = 'last30days';
    filterState.startDate = null;
    filterState.endDate = null;
    filterState.channelIds = [];
    filterState.storeIds = [];
    filterState.status = 'COMPLETED';
    filterState.categoryId = null;
    filterState.minAmount = null;
    filterState.maxAmount = null;

    // Reseta selects
    document.getElementById('filterPeriod').value = 'last30days';
    document.getElementById('filterChannels').selectedIndex = -1;
    document.getElementById('filterStores').selectedIndex = -1;
    document.getElementById('filterStatus').value = 'COMPLETED';
    document.getElementById('filterStartDate').value = '';
    document.getElementById('filterEndDate').value = '';

    // Esconde datas customizadas
    document.querySelectorAll('.custom-dates').forEach(el => el.style.display = 'none');

    // Limpa badges
    document.getElementById('activeFilters').innerHTML = '';

    console.log('🧹 Filtros limpos');

    // Recarrega dashboard
    await refreshDashboard();
    
    // Feedback visual
    showToast('Filtros limpos', 'info');
}

/**
 * Atualiza badges de filtros ativos
 */
function updateActiveFiltersBadges() {
    const container = document.getElementById('activeFilters');
    container.innerHTML = '';

    const badges = [];

    // Período
    if (filterState.period) {
        const periodLabels = {
            'last7days': 'Últimos 7 dias',
            'last30days': 'Últimos 30 dias',
            'last90days': 'Últimos 90 dias',
            'thisMonth': 'Este mês',
            'lastMonth': 'Mês passado',
            'thisYear': 'Este ano'
        };
        badges.push({
            label: 'Período',
            value: periodLabels[filterState.period] || filterState.period,
            color: 'primary'
        });
    } else if (filterState.startDate && filterState.endDate) {
        badges.push({
            label: 'Período',
            value: `${formatDate(filterState.startDate)} a ${formatDate(filterState.endDate)}`,
            color: 'primary'
        });
    }

    // Canais
    if (filterState.channelIds.length > 0) {
        badges.push({
            label: 'Canais',
            value: `${filterState.channelIds.length} selecionado(s)`,
            color: 'info'
        });
    }

    // Lojas
    if (filterState.storeIds.length > 0) {
        badges.push({
            label: 'Lojas',
            value: `${filterState.storeIds.length} selecionada(s)`,
            color: 'info'
        });
    }

    // Status
    if (filterState.status && filterState.status !== '') {
        const statusLabel = filterState.status === 'COMPLETED' ? 'Completo' : 
                           filterState.status === 'CANCELLED' ? 'Cancelado' : 'Todos';
        badges.push({
            label: 'Status',
            value: statusLabel,
            color: filterState.status === 'COMPLETED' ? 'success' : 
                   filterState.status === 'CANCELLED' ? 'danger' : 'secondary'
        });
    }

    // Renderiza badges
    if (badges.length > 0) {
        const badgesHTML = badges.map(badge => `
            <span class="badge bg-${badge.color} me-2 mb-2">
                <strong>${badge.label}:</strong> ${badge.value}
            </span>
        `).join('');

        container.innerHTML = `
            <div class="d-flex align-items-center flex-wrap">
                <small class="text-muted me-2 mb-2"><strong>Filtros Ativos:</strong></small>
                ${badgesHTML}
            </div>
        `;
    }
}

/**
 * Constrói query string dos filtros
 */
function buildFilterQueryString() {
    const params = new URLSearchParams();

    if (filterState.period) {
        params.append('period', filterState.period);
    }
    if (filterState.startDate) {
        params.append('startDate', filterState.startDate);
    }
    if (filterState.endDate) {
        params.append('endDate', filterState.endDate);
    }
    if (filterState.channelIds.length > 0) {
        filterState.channelIds.forEach(id => {
            params.append('channelIds', id);
        });
    }
    if (filterState.storeIds.length > 0) {
        filterState.storeIds.forEach(id => {
            params.append('storeIds', id);
        });
    }
    if (filterState.status && filterState.status !== '') {
        params.append('status', filterState.status);
    }
    if (filterState.categoryId) {
        params.append('categoryId', filterState.categoryId);
    }
    if (filterState.minAmount) {
        params.append('minAmount', filterState.minAmount);
    }
    if (filterState.maxAmount) {
        params.append('maxAmount', filterState.maxAmount);
    }

    return params.toString();
}

/**
 * Busca textual
 */
async function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.trim();
    const searchType = document.getElementById('searchType').value;

    if (searchTerm.length < 2) {
        showToast('Digite pelo menos 2 caracteres para buscar', 'warning');
        return;
    }

    showLoading();

    try {
        const queryString = buildFilterQueryString();
        const response = await fetch(
            `${API_BASE}/search?term=${encodeURIComponent(searchTerm)}&type=${searchType}&${queryString}`
        );
        const result = await response.json();

        if (result.success) {
            displaySearchResults(result.data, searchType);
        } else {
            console.error('Erro na busca:', result.error);
            showToast(`Erro na busca: ${result.error}`, 'danger');
        }
    } catch (error) {
        console.error('Erro de rede na busca:', error);
        showToast('Erro ao realizar busca', 'danger');
    } finally {
        hideLoading();
    }
}

/**
 * Exibe resultados da busca
 */
function displaySearchResults(data, searchType) {
    const resultsContainer = document.getElementById('searchResults');

    if (!data || data.length === 0) {
        resultsContainer.innerHTML = `
            <div class="alert alert-info">
                <i class="bi bi-info-circle"></i>
                Nenhum resultado encontrado
            </div>
        `;
    } else {
        let tableHTML = '';

        if (searchType === 'product') {
            tableHTML = `
                <table class="table table-hover table-sm">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Produto</th>
                            <th>Categoria</th>
                            <th>Vezes Vendido</th>
                            <th>Faturamento</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>${item.id}</td>
                                <td>${item.name || item.product_name}</td>
                                <td>${item.category_name || '-'}</td>
                                <td>${formatNumber(item.times_sold || 0)}</td>
                                <td>${formatCurrency(item.total_revenue || 0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (searchType === 'customer') {
            tableHTML = `
                <table class="table table-hover table-sm">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Email</th>
                            <th>Total Compras</th>
                            <th>Valor Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>${item.id}</td>
                                <td>${item.customer_name}</td>
                                <td>${item.email || '-'}</td>
                                <td>${formatNumber(item.total_purchases || 0)}</td>
                                <td>${formatCurrency(item.total_spent || 0)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else if (searchType === 'sale') {
            tableHTML = `
                <table class="table table-hover table-sm">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Data</th>
                            <th>Cliente</th>
                            <th>Loja</th>
                            <th>Canal</th>
                            <th>Status</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>${item.id}</td>
                                <td>${formatDateTime(item.created_at)}</td>
                                <td>${item.customer_name || 'Anônimo'}</td>
                                <td>${item.store_name}</td>
                                <td>${item.channel_name}</td>
                                <td><span class="badge bg-${item.sale_status_desc === 'COMPLETED' ? 'success' : 'danger'}">${item.sale_status_desc}</span></td>
                                <td>${formatCurrency(item.total_amount)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        resultsContainer.innerHTML = `
            <div class="mb-3">
                <strong>${data.length}</strong> resultado(s) encontrado(s)
            </div>
            <div class="table-responsive">
                ${tableHTML}
            </div>
        `;
    }

    // Abre modal
    const modal = new bootstrap.Modal(document.getElementById('searchModal'));
    modal.show();
}

/**
 * Handle busca ao pressionar Enter
 */
function handleSearchKeyup(e) {
    if (e.key === 'Enter') {
        performSearch();
    }
}

/**
 * Exporta dados filtrados
 */
async function exportData(format) {
    const exportType = prompt('Digite o tipo de exportação:\n- sales\n- products\n- customers\n- deliveries', 'sales');

    if (!exportType) return;

    showLoading();

    try {
        const response = await fetch(`${API_BASE}/export`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: exportType,
                format: format,
                filters: filterState
            })
        });

        if (response.ok) {
            // Baixa arquivo
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${exportType}_export_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showToast(`Exportação de ${exportType} concluída!`, 'success');
        } else {
            const error = await response.json();
            showToast(`Erro na exportação: ${error.message || error.error}`, 'danger');
        }
    } catch (error) {
        console.error('Erro na exportação:', error);
        showToast('Erro ao exportar dados', 'danger');
    } finally {
        hideLoading();
    }
}

/**
 * Mostra toast de feedback
 */
function showToast(message, type = 'info') {
    // Remove toasts antigos
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

/**
 * Formata data
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora
 */
function formatDateTime(datetimeString) {
    if (!datetimeString) return '-';
    const d = new Date(datetimeString);
    return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR')}`;
}

// Inicializa ao carregar
document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    
    // Restaura estado de expansão após setup
    setTimeout(() => {
        restoreFilterState();
    }, 100);
});