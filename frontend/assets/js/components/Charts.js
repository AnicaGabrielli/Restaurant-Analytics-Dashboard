export class Charts {
  constructor() {
    this.charts = {};
  }

  createHourlyChart(data) {
    const ctx = document.getElementById('hourlyChart');
    if (!ctx) return;

    if (this.charts.hourly) {
      this.charts.hourly.destroy();
    }

    this.charts.hourly = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => `${d.hour}h`),
        datasets: [{
          label: 'Vendas',
          data: data.map(d => d.sales_count),
          backgroundColor: 'rgba(216, 67, 21, 0.7)',
          borderColor: 'rgba(216, 67, 21, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  createChannelChart(data) {
    const ctx = document.getElementById('channelChart');
    if (!ctx) return;

    if (this.charts.channel) {
      this.charts.channel.destroy();
    }

    const colors = [
      '#D84315', '#FF6F00', '#558B2F', '#F57C00', '#FBC02D', '#C62828'
    ];

    this.charts.channel = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: data.map(d => d.channel_name),
        datasets: [{
          data: data.map(d => d.revenue),
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  createLineChart(canvasId, labels, data, label) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    this.charts[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: label,
          data: data,
          borderColor: '#D84315',
          backgroundColor: 'rgba(216, 67, 21, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createBarChart(canvasId, labels, datasets) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }

    this.charts[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createWeekdayChart(data) {
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const ctx = document.getElementById('weekdayChart');
    if (!ctx) return;

    if (this.charts.weekday) {
      this.charts.weekday.destroy();
    }

    this.charts.weekday = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => weekdays[d.weekday - 1]),
        datasets: [{
          label: 'Vendas',
          data: data.map(d => d.sales_count),
          backgroundColor: 'rgba(255, 111, 0, 0.7)',
          borderColor: 'rgba(255, 111, 0, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  destroy(chartId) {
    if (this.charts[chartId]) {
      this.charts[chartId].destroy();
      delete this.charts[chartId];
    }
  }

  destroyAll() {
    Object.keys(this.charts).forEach(key => {
      this.charts[key].destroy();
    });
    this.charts = {};
  }
}

export default Charts;