// Constantes globais da aplicação

// Cores dos gráficos (consistentes em todo o app)
export const CHART_COLORS = {
  primary: '#D84315',
  secondary: '#FF6F00',
  success: '#558B2F',
  info: '#F57C00',
  warning: '#FBC02D',
  danger: '#C62828',
  dark: '#3E2723',
  light: '#FFF3E0'
};

export const CHART_COLORS_ARRAY = [
  '#D84315', '#FF6F00', '#558B2F', '#F57C00', '#FBC02D', '#C62828'
];

export const CHART_COLORS_RGBA = {
  primary: 'rgba(216, 67, 21, 0.7)',
  secondary: 'rgba(255, 111, 0, 0.7)',
  success: 'rgba(85, 139, 47, 0.7)',
  info: 'rgba(245, 124, 0, 0.7)',
  warning: 'rgba(251, 192, 45, 0.7)',
  danger: 'rgba(198, 40, 40, 0.7)'
};

// Nomes dos dias da semana
export const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
export const WEEKDAY_NAMES_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Limiares de margem de lucro
export const MARGIN_THRESHOLDS = {
  CRITICAL: 20,  // Abaixo de 20% = crítico
  WARNING: 30,   // Entre 20-30% = atenção
  HEALTHY: 30    // Acima de 30% = saudável
};

// Limiares de taxa de conclusão
export const COMPLETION_RATE_THRESHOLDS = {
  EXCELLENT: 90, // >= 90% = excelente
  GOOD: 80,      // >= 80% = bom
  POOR: 80       // < 80% = ruim
};

// Dias para definir churn
export const CHURN_DAYS = {
  MIN_ORDERS: 3,           // Mínimo de pedidos para considerar
  DAYS_INACTIVE: 30,       // Dias sem comprar
  RISK_THRESHOLD: 90       // Dias para alto risco
};

// Segmentos RFM
export const RFM_SEGMENTS = {
  VIP: 'VIP',
  LOYAL: 'Leal',
  PROMISING: 'Promissor',
  AT_RISK: 'Em Risco',
  LOST: 'Perdido',
  NEW: 'Novo'
};

// Períodos padrão para filtros
export const DEFAULT_PERIODS = {
  LAST_7_DAYS: 7,
  LAST_30_DAYS: 30,
  LAST_90_DAYS: 90,
  LAST_180_DAYS: 180,
  LAST_YEAR: 365
};

// Limites de resultados
export const RESULT_LIMITS = {
  TOP_PRODUCTS: 20,
  TOP_CUSTOMERS: 20,
  TOP_CUSTOMIZATIONS: 20,
  DASHBOARD_PRODUCTS: 10,
  CHART_MAX_ITEMS: 15
};

// Mensagens de erro padrão
export const ERROR_MESSAGES = {
  NO_DATA: 'Nenhum dado encontrado para os filtros selecionados',
  LOAD_ERROR: 'Erro ao carregar dados. Tente novamente.',
  EXPORT_ERROR: 'Erro ao exportar dados',
  CONNECTION_ERROR: 'Erro de conexão com o servidor',
  INVALID_DATE: 'Data inválida'
};

// Mensagens de sucesso
export const SUCCESS_MESSAGES = {
  EXPORT_CSV: 'CSV exportado com sucesso!',
  EXPORT_PDF: 'PDF exportado com sucesso!',
  DATA_LOADED: 'Dados carregados com sucesso'
};

// Configurações de loading
export const LOADING_CONFIG = {
  MIN_DISPLAY_TIME: 300,  // Tempo mínimo para mostrar loading (ms)
  TIMEOUT: 30000          // Timeout para requisições (ms)
};

// API Base URL
export const API_BASE_URL = '/api';

// Configurações de gráficos
export const CHART_CONFIG = {
  responsive: true,
  maintainAspectRatio: true,
  animation: {
    duration: 750
  }
};

// Formatos de data
export const DATE_FORMATS = {
  MYSQL: 'YYYY-MM-DD',
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm'
};

export default {
  CHART_COLORS,
  CHART_COLORS_ARRAY,
  CHART_COLORS_RGBA,
  WEEKDAY_NAMES,
  WEEKDAY_NAMES_FULL,
  MARGIN_THRESHOLDS,
  COMPLETION_RATE_THRESHOLDS,
  CHURN_DAYS,
  RFM_SEGMENTS,
  DEFAULT_PERIODS,
  RESULT_LIMITS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOADING_CONFIG,
  API_BASE_URL,
  CHART_CONFIG,
  DATE_FORMATS
};