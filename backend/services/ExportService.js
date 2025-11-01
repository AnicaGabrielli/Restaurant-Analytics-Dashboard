import { ExportLimitError } from '../utils/errorHandler.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';

export class ExportService {
    constructor() {
        this.maxRecords = config.export.maxRecords;
    }
    
    validateExportLimit(count) {
        if (count > this.maxRecords) {
            logger.warn(`Export limit exceeded: ${count} records`);
            throw new ExportLimitError(this.maxRecords);
        }
    }
    
    toCSV(data, columns) {
        if (!data || data.length === 0) return '';
        
        const header = columns.map(c => c.label).join(',');
        const rows = data.map(row => {
            return columns.map(col => {
                let value = row[col.key];
                
                if (value === null || value === undefined) return '';
                
                // Formata por tipo
                switch (col.type) {
                    case 'currency':
                        value = this.formatCurrency(value);
                        break;
                    case 'date':
                        value = this.formatDate(value);
                        break;
                }
                
                // Escapa vírgulas e aspas
                const str = String(value);
                if (str.includes(',') || str.includes('"')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',');
        });
        
        return '\uFEFF' + [header, ...rows].join('\n'); // BOM para Excel UTF-8
    }
    
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    }
    
    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('pt-BR');
    }
}

export default new ExportService();