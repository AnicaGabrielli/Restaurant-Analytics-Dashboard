// ========== frontend/js/charts.js ==========

// Configurações globais dos gráficos
Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#2D3142';

// Paleta de cores gastronômica
const foodColors = {
    primary: ['#FF6B35', '#E63946', '#FFD23F', '#06A77D', '#3A86FF', '#8B4513'],
    gradients: {
        orange: {
            start: 'rgba(255, 107, 53, 0.8)',
            end: 'rgba(255, 107, 53, 0.2)'
        },
        red: {
            start: 'rgba(230, 57, 70, 0.8)',
            end: 'rgba(230, 57, 70, 0.2)'
        },
        green: {
            start: 'rgba(6, 167, 125, 0.8)',
            end: 'rgba(6, 167, 125, 0.2)'
        },
        blue: {
            start: 'rgba(58, 134, 255, 0.8)',
            end: 'rgba(58, 134, 255, 0.2)'
        }
    }
};

// Classe para gerenciar gráficos
class ChartManager {
    constructor() {
        this.charts = {};
    }

    // Destrói gráfico existente
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    }

    // Cria gradiente
    createGradient(ctx, color) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, color.start);
        gradient.addColorStop(1, color.end);
        return gradient;
    }

    // Gráfico de linha (vendas por período)
    createSalesTrendChart(canvasId, data) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => new Date(d.period).toLocaleDateString('pt-BR')),
                datasets: [{
                    label: 'Faturamento (R$)',
                    data: data.map(d => parseFloat(d.revenue) || 0),
                    borderColor: '#FF6B35',
                    backgroundColor: this.createGradient(ctx, foodColors.gradients.orange),
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#FF6B35'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(45, 49, 66, 0.9)',
                        callbacks: {
                            label: (context) => {
                                return `Faturamento: R$ ${context.parsed.y.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `R$ ${value.toLocaleString('pt-BR')}`
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Gráfico de pizza (canais)
    createChannelChart(canvasId, data) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.channel_name),
                datasets: [{
                    data: data.map(d => parseFloat(d.revenue) || 0),
                    backgroundColor: foodColors.primary,
                    borderWidth: 3,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(45, 49, 66, 0.9)',
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfico de barras horizontal (lojas)
    createStoreChart(canvasId, data) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.store_name),
                datasets: [{
                    label: 'Faturamento (R$)',
                    data: data.map(d => parseFloat(d.revenue) || 0),
                    backgroundColor: foodColors.primary,
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(45, 49, 66, 0.9)',
                        callbacks: {
                            label: (context) => {
                                return `Faturamento: R$ ${context.parsed.x.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `R$ ${value.toLocaleString('pt-BR')}`
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Gráfico de barras (por hora)
    createHourlyChart(canvasId, data) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => `${d.hour}h`),
                datasets: [{
                    label: 'Vendas',
                    data: data.map(d => d.total_sales),
                    backgroundColor: '#FF6B35',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(45, 49, 66, 0.9)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Gráfico de barras (dia da semana)
    createWeekdayChart(canvasId, data) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.weekday_name),
                datasets: [{
                    label: 'Faturamento (R$)',
                    data: data.map(d => parseFloat(d.revenue) || 0),
                    backgroundColor: foodColors.primary,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(45, 49, 66, 0.9)',
                        callbacks: {
                            label: (context) => {
                                return `Faturamento: R$ ${context.parsed.y.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `R$ ${value.toLocaleString('pt-BR')}`
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Gráfico de barras horizontal (produtos)
    createTopProductsChart(canvasId, data) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.product_name.substring(0, 30)),
                datasets: [{
                    label: 'Faturamento (R$)',
                    data: data.map(d => parseFloat(d.total_revenue) || 0),
                    backgroundColor: foodColors.primary,
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(45, 49, 66, 0.9)',
                        callbacks: {
                            label: (context) => {
                                return `Faturamento: R$ ${context.parsed.x.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `R$ ${value.toLocaleString('pt-BR')}`
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Gráfico de pizza (categorias)
    createCategoriesChart(canvasId, data) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.map(d => d.category_name),
                datasets: [{
                    data: data.map(d => parseFloat(d.total_revenue) || 0),
                    backgroundColor: foodColors.primary,
                    borderWidth: 3,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(45, 49, 66, 0.9)',
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed || 0;
                                return `${context.label}: R$ ${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Gráfico de barras (top itens)
    createTopItemsChart(canvasId, data) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.item_name),
                datasets: [{
                    label: 'Vezes Adicionado',
                    data: data.map(d => d.times_added),
                    backgroundColor: '#06A77D',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(45, 49, 66, 0.9)'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Gráfico de customizações
    createCustomizedProductsChart(canvasId, data) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.product_name.substring(0, 25)),
                datasets: [{
                    label: 'Taxa de Customização (%)',
                    data: data.map(d => parseFloat(d.customization_rate) || 0),
                    backgroundColor: '#FFD23F',
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(45, 49, 66, 0.9)',
                        callbacks: {
                            label: (context) => {
                                return `Taxa: ${context.parsed.x.toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `${value}%`
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Gráficos de clientes
    createCustomerTypeChart(canvasId, data) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.customer_type),
                datasets: [{
                    data: data.map(d => d.count),
                    backgroundColor: ['#06A77D', '#3A86FF'],
                    borderWidth: 3,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(45, 49, 66, 0.9)'
                    }
                }
            }
        });
    }

    createRetentionChart(canvasId, data) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.segment),
                datasets: [{
                    label: 'Número de Clientes',
                    data: data.map(d => d.customer_count),
                    backgroundColor: foodColors.primary,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(45, 49, 66, 0.9)',
                        callbacks: {
                            afterLabel: (context) => {
                                const dataIndex = context.dataIndex;
                                const revenue = data[dataIndex].total_revenue;
                                return `Receita Total: R$ ${parseFloat(revenue).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Gráficos de delivery
    createTopNeighborhoodsChart(canvasId, data) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => `${d.neighborhood}, ${d.city}`),
                datasets: [{
                    label: 'Número de Entregas',
                    data: data.map(d => d.delivery_count),
                    backgroundColor: '#E63946',
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(45, 49, 66, 0.9)'
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    createDeliveryPerformanceChart(canvasId, data) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => `${d.neighborhood}, ${d.city}`),
                datasets: [{
                    label: 'Tempo Médio (min)',
                    data: data.map(d => parseFloat(d.avg_delivery_minutes) || 0),
                    backgroundColor: '#FFD23F',
                    borderRadius: 8
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(45, 49, 66, 0.9)',
                        callbacks: {
                            label: (context) => {
                                return `Tempo Médio: ${context.parsed.x.toFixed(1)} min`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => `${value} min`
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// Instância global
const chartManager = new ChartManager();