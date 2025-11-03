import { WEEKDAY_NAMES, ERROR_MESSAGES } from './constants.js';

/**
 * Formata valor como moeda brasileira
 */
export function formatCurrency(value) {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
}

/**
 * Formata número com separadores brasileiros
 */
export function formatNumber(value) {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '0';
  
  return new Intl.NumberFormat('pt-BR').format(numValue);
}

/**
 * Formata porcentagem
 */
export function formatPercent(value, decimals = 1) {
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '0%';
  
  return numValue.toFixed(decimals) + '%';
}

/**
 * Retorna intervalo de datas (startDate e endDate)
 */
export function getDateRange(days) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}

/**
 * Valida se uma string é uma data válida
 */
export function isValidDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Formata data para exibição
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  } catch (error) {
    return dateString;
  }
}

/**
 * Formata data e hora para exibição
 */
export function formatDateTime(dateString) {
  if (!dateString) return '-';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  } catch (error) {
    return dateString;
  }
}

/**
 * Exporta dados como CSV
 */
export function downloadCSV(data, filename) {
  if (!data || data.length === 0) {
    showToast(ERROR_MESSAGES.NO_DATA, 'warning');
    return;
  }

  try {
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape aspas e vírgulas
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = `${filename}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showToast('CSV exportado com sucesso!', 'success');
  } catch (error) {
    console.error('Error exporting CSV:', error);
    showToast(ERROR_MESSAGES.EXPORT_ERROR, 'danger');
  }
}

/**
 * Mostra loading em um elemento
 */
export function showLoading(elementId, message = 'Carregando...') {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div class="d-flex justify-content-center align-items-center py-5">
        <div class="spinner-border text-primary me-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span class="text-muted">${message}</span>
      </div>
    `;
  }
}

/**
 * Mostra mensagem de erro em um elemento
 */
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

/**
 * Mostra mensagem de "sem dados"
 */
export function showNoData(elementId, message = ERROR_MESSAGES.NO_DATA) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div class="alert alert-info" role="alert">
        <i class="fas fa-info-circle me-2"></i>
        ${message}
      </div>
    `;
  }
}

/**
 * Mostra toast notification
 */
export function showToast(message, type = 'info', duration = 3000) {
  const toastContainer = document.getElementById('toastContainer') || createToastContainer();
  
  const bgClass = {
    success: 'bg-success',
    danger: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-info'
  }[type] || 'bg-info';
  
  const icon = {
    success: 'fa-check-circle',
    danger: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  }[type] || 'fa-info-circle';
  
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white ${bgClass} border-0`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="fas ${icon} me-2"></i>${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: duration });
  bsToast.show();
  
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

/**
 * Cria container de toasts se não existir
 */
function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container position-fixed top-0 end-0 p-3';
  container.style.zIndex = '9999';
  document.body.appendChild(container);
  return container;
}

/**
 * Debounce function para otimizar eventos
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Trunca texto longo
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Retorna classe CSS baseada em margem
 */
export function getMarginClass(margin) {
  const numMargin = parseFloat(margin);
  if (isNaN(numMargin)) return 'text-muted';
  if (numMargin < 20) return 'text-danger';
  if (numMargin < 30) return 'text-warning';
  return 'text-success';
}

/**
 * Retorna classe CSS baseada em taxa de conclusão
 */
export function getCompletionRateClass(rate) {
  const numRate = parseFloat(rate);
  if (isNaN(numRate)) return 'bg-secondary';
  if (numRate >= 90) return 'bg-success';
  if (numRate >= 80) return 'bg-warning';
  return 'bg-danger';
}

/**
 * Copia texto para clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copiado para área de transferência!', 'success');
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    showToast('Erro ao copiar', 'danger');
  }
}

/**
 * Gera ID único
 */
export function generateId() {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitiza nome de arquivo
 */
export function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
}

/**
 * Verifica se está em mobile
 */
export function isMobile() {
  return window.innerWidth < 768;
}

/**
 * Scroll suave para elemento
 */
export function scrollToElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/**
 * Retorna nome do dia da semana
 */
export function getWeekdayName(weekdayNumber) {
  const index = parseInt(weekdayNumber) - 1;
  return WEEKDAY_NAMES[index] || '';
}

/**
 * Analisa query string da URL
 */
export function getQueryParams() {
  const params = {};
  const queryString = window.location.search.substring(1);
  const pairs = queryString.split('&');
  
  pairs.forEach(pair => {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '');
    }
  });
  
  return params;
}

/**
 * Atualiza query string da URL sem recarregar
 */
export function updateQueryParams(params) {
  const url = new URL(window.location);
  Object.keys(params).forEach(key => {
    if (params[key]) {
      url.searchParams.set(key, params[key]);
    } else {
      url.searchParams.delete(key);
    }
  });
  window.history.pushState({}, '', url);
}

/**
 * Formata número de telefone brasileiro
 */
export function formatPhone(phone) {
  if (!phone) return '-';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `(${cleaned.substr(0, 2)}) ${cleaned.substr(2, 5)}-${cleaned.substr(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.substr(0, 2)}) ${cleaned.substr(2, 4)}-${cleaned.substr(6)}`;
  }
  return phone;
}

export default {
  formatCurrency,
  formatNumber,
  formatPercent,
  getDateRange,
  isValidDate,
  formatDate,
  formatDateTime,
  downloadCSV,
  showLoading,
  showError,
  showNoData,
  showToast,
  debounce,
  truncateText,
  getMarginClass,
  getCompletionRateClass,
  copyToClipboard,
  generateId,
  sanitizeFilename,
  isMobile,
  scrollToElement,
  getWeekdayName,
  getQueryParams,
  updateQueryParams,
  formatPhone
};