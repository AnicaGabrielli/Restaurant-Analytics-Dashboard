export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value || 0);
}

export function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(value || 0);
}

export function getDateRange(days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

export function downloadCSV(data, filename) {
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header];
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(','))
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div class="spinner-container">
        <div class="spinner-border" role="status">
          <span class="visually-hidden">Carregando...</span>
        </div>
      </div>
    `;
  }
}

export function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div class="alert alert-danger" role="alert">
        <i class="fas fa-exclamation-triangle me-2"></i>
        ${message}
      </div>
    `;
  }
}

export const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];