import db from '../config/database.js';

// Classe base para todos os models
// Contém métodos compartilhados e utilitários comuns
class BaseModel {
  /**
   * Constrói cláusula WHERE e array de parâmetros para queries
   * @param {Object} filters - Objeto com filtros (startDate, endDate, storeId, channelId, etc)
   * @param {String} tableAlias - Alias da tabela principal (padrão: 's' para sales)
   * @returns {Object} { clause: String, params: Array }
   */
  static buildWhereClause(filters = {}, tableAlias = 's') {
    const conditions = [];
    const params = [];

    // Filtro de data inicial
    if (filters.startDate) {
      conditions.push(`${tableAlias}.created_at >= ?`);
      params.push(filters.startDate + ' 00:00:00');
    }

    // Filtro de data final
    if (filters.endDate) {
      conditions.push(`${tableAlias}.created_at <= ?`);
      params.push(filters.endDate + ' 23:59:59');
    }

    // Filtro de loja
    if (filters.storeId) {
      conditions.push(`${tableAlias}.store_id = ?`);
      params.push(parseInt(filters.storeId));
    }

    // Filtro de canal
    if (filters.channelId) {
      conditions.push(`${tableAlias}.channel_id = ?`);
      params.push(parseInt(filters.channelId));
    }

    // Filtro de categoria (para produtos)
    if (filters.categoryId) {
      conditions.push('p.category_id = ?');
      params.push(parseInt(filters.categoryId));
    }

    // Filtro de dia da semana
    if (filters.weekday) {
      conditions.push(`DAYOFWEEK(${tableAlias}.created_at) = ?`);
      params.push(parseInt(filters.weekday));
    }

    // Filtro de hora
    if (filters.hour !== undefined) {
      conditions.push(`HOUR(${tableAlias}.created_at) = ?`);
      params.push(parseInt(filters.hour));
    }

    // Filtro de status
    if (filters.status) {
      conditions.push(`${tableAlias}.sale_status_desc = ?`);
      params.push(filters.status);
    }

    const clause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    return { clause, params };
  }

  /**
   * Adiciona paginação à query
   * @param {Number} page - Número da página (começa em 1)
   * @param {Number} pageSize - Tamanho da página
   * @returns {String} Cláusula LIMIT com OFFSET
   */
  static buildPaginationClause(page, pageSize = 20) {
    if (!page || page < 1) return '';
    
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    return `LIMIT ${parseInt(pageSize)} OFFSET ${offset}`;
  }

  /**
   * Adiciona ORDER BY à query
   * @param {String} column - Coluna para ordenar
   * @param {String} direction - ASC ou DESC
   * @returns {String} Cláusula ORDER BY
   */
  static buildOrderByClause(column, direction = 'DESC') {
    if (!column) return '';
    
    const safeDirection = direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    return `ORDER BY ${column} ${safeDirection}`;
  }

  /**
   * Adiciona LIMIT à query (sem paginação)
   * @param {Number} limit - Número máximo de resultados
   * @returns {String} Cláusula LIMIT
   */
  static buildLimitClause(limit) {
    if (!limit || limit < 1) return '';
    return `LIMIT ${parseInt(limit)}`;
  }

  /**
   * Executa query com tratamento de erro padrão
   * @param {String} query - Query SQL
   * @param {Array} params - Parâmetros da query
   * @returns {Promise<Array>} Resultado da query
   */
  static async executeQuery(query, params = []) {
    try {
      const [rows] = await db.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Database query error:', error.message);
      console.error('Query:', query);
      console.error('Params:', params);
      throw error;
    }
  }

  /**
   * Retorna formato de data para agrupamento
   * @param {String} groupBy - 'day', 'week', ou 'month'
   * @returns {String} Formato MySQL
   */
  static getDateFormat(groupBy = 'day') {
    const formats = {
      day: '%Y-%m-%d',
      week: '%Y-%u',
      month: '%Y-%m',
      year: '%Y'
    };
    return formats[groupBy] || formats.day;
  }

  /**
   * Sanitiza valor numérico
   * @param {*} value - Valor para sanitizar
   * @param {Number} defaultValue - Valor padrão se inválido
   * @returns {Number}
   */
  static sanitizeNumber(value, defaultValue = 0) {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Sanitiza valor inteiro
   * @param {*} value - Valor para sanitizar
   * @param {Number} defaultValue - Valor padrão se inválido
   * @returns {Number}
   */
  static sanitizeInteger(value, defaultValue = 0) {
    const num = parseInt(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * Converte valores NULL em 0 para agregações
   * @param {String} column - Nome da coluna
   * @param {Number} defaultValue - Valor padrão
   * @returns {String} Expressão COALESCE
   */
  static coalesce(column, defaultValue = 0) {
    return `COALESCE(${column}, ${defaultValue})`;
  }

  /**
   * Formata resultado com valores sanitizados
   * @param {Array} rows - Linhas do resultado
   * @returns {Array} Linhas formatadas
   */
  static formatResults(rows) {
    return rows.map(row => {
      const formatted = {};
      for (const [key, value] of Object.entries(row)) {
        // Converte NULL em valores apropriados
        if (value === null) {
          formatted[key] = 0;
        } else if (typeof value === 'number') {
          // Garante que números sejam válidos
          formatted[key] = isNaN(value) ? 0 : value;
        } else {
          formatted[key] = value;
        }
      }
      return formatted;
    });
  }
}

export default BaseModel;