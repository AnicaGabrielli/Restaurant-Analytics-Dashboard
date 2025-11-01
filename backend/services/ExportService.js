// ========== backend/services/ExportService.js ==========
/**
 * Serviço de exportação de dados
 * Suporta CSV, Excel (XLSX) e JSON
 */

export class ExportService {
    constructor() {
        this.maxExportRecords = 10000; // Limite de segurança
    }

    /**
     * Converte dados para CSV
     * @param {Array} data - Array de objetos
     * @param {Array} columns - Colunas a exportar (opcional)
     * @returns {string} CSV string
     */
    toCSV(data, columns = null) {
        if (!data || data.length === 0) {
            return '';
        }

        // Define colunas (usa todas ou apenas as especificadas)
        const cols = columns || Object.keys(data[0]);

        // Header
        const header = cols.join(',');

        // Rows
        const rows = data.map(row => {
            return cols.map(col => {
                const value = row[col];
                
                // Trata valores especiais
                if (value === null || value === undefined) {
                    return '';
                }
                
                // Escapa vírgulas e aspas
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                
                return stringValue;
            }).join(',');
        });

        return [header, ...rows].join('\n');
    }

    /**
     * Converte dados para formato Excel-compatible CSV
     * @param {Array} data - Array de objetos
     * @param {Array} columns - Colunas com metadados
     * @returns {string} CSV string com formatação Excel
     */
    toExcelCSV(data, columns = null) {
        if (!data || data.length === 0) {
            return '';
        }

        const cols = columns || Object.keys(data[0]).map(key => ({
            key,
            label: key,
            type: 'string'
        }));

        // Header com labels
        const header = cols.map(col => col.label).join(',');

        // Rows com formatação por tipo
        const rows = data.map(row => {
            return cols.map(col => {
                const value = row[col.key];
                
                if (value === null || value === undefined) {
                    return '';
                }

                // Formatação baseada no tipo
                switch (col.type) {
                    case 'currency':
                        return `"${this.formatCurrency(value)}"`;
                    case 'number':
                        return parseFloat(value) || 0;
                    case 'date':
                        return `"${this.formatDate(value)}"`;
                    case 'datetime':
                        return `"${this.formatDateTime(value)}"`;
                    default:
                        const stringValue = String(value);
                        if (stringValue.includes(',') || stringValue.includes('"')) {
                            return `"${stringValue.replace(/"/g, '""')}"`;
                        }
                        return stringValue;
                }
            }).join(',');
        });

        // BOM para Excel reconhecer UTF-8
        return '\uFEFF' + [header, ...rows].join('\n');
    }

    /**
     * Converte dados para JSON formatado
     * @param {Array} data - Array de objetos
     * @param {boolean} pretty - Se deve formatar com indentação
     * @returns {string} JSON string
     */
    toJSON(data, pretty = true) {
        return JSON.stringify(data, null, pretty ? 2 : 0);
    }

    /**
     * Exporta vendas com filtros aplicados
     * @param {Array} sales - Vendas filtradas
     * @returns {Object} Dados formatados para export
     */
    formatSalesExport(sales) {
        return sales.map(sale => ({
            'ID': sale.id,
            'Data': this.formatDateTime(sale.created_at),
            'Loja': sale.store_name,
            'Cidade': sale.store_city,
            'Canal': sale.channel_name,
            'Cliente': sale.customer_name || 'Anônimo',
            'Email': sale.email || '-',
            'Status': sale.sale_status_desc,
            'Valor Itens': this.formatCurrency(sale.total_amount_items),
            'Desconto': this.formatCurrency(sale.total_discount),
            'Taxa Entrega': this.formatCurrency(sale.delivery_fee),
            'Taxa Serviço': this.formatCurrency(sale.service_tax_fee),
            'Total': this.formatCurrency(sale.total_amount),
            'Pago': this.formatCurrency(sale.value_paid),
            'Pessoas': sale.people_quantity || '-',
            'Tempo Produção (min)': sale.production_seconds ? Math.round(sale.production_seconds / 60) : '-',
            'Tempo Entrega (min)': sale.delivery_seconds ? Math.round(sale.delivery_seconds / 60) : '-'
        }));
    }

    /**
     * Define colunas para exportação de vendas
     * @returns {Array} Colunas com metadados
     */
    getSalesColumns() {
        return [
            { key: 'ID', label: 'ID', type: 'number' },
            { key: 'Data', label: 'Data/Hora', type: 'datetime' },
            { key: 'Loja', label: 'Loja', type: 'string' },
            { key: 'Cidade', label: 'Cidade', type: 'string' },
            { key: 'Canal', label: 'Canal', type: 'string' },
            { key: 'Cliente', label: 'Cliente', type: 'string' },
            { key: 'Email', label: 'Email', type: 'string' },
            { key: 'Status', label: 'Status', type: 'string' },
            { key: 'Valor Itens', label: 'Valor Itens', type: 'currency' },
            { key: 'Desconto', label: 'Desconto', type: 'currency' },
            { key: 'Taxa Entrega', label: 'Taxa Entrega', type: 'currency' },
            { key: 'Taxa Serviço', label: 'Taxa Serviço', type: 'currency' },
            { key: 'Total', label: 'Total', type: 'currency' },
            { key: 'Pago', label: 'Pago', type: 'currency' },
            { key: 'Pessoas', label: 'Pessoas', type: 'string' },
            { key: 'Tempo Produção (min)', label: 'Produção (min)', type: 'string' },
            { key: 'Tempo Entrega (min)', label: 'Entrega (min)', type: 'string' }
        ];
    }

    /**
     * Exporta produtos
     * @param {Array} products - Produtos
     * @returns {Object} Dados formatados
     */
    formatProductsExport(products) {
        return products.map(product => ({
            'ID': product.id,
            'Produto': product.product_name,
            'Categoria': product.category_name || '-',
            'Vezes Vendido': product.times_sold,
            'Quantidade Total': product.total_quantity,
            'Faturamento': this.formatCurrency(product.total_revenue),
            'Preço Médio': this.formatCurrency(product.avg_price)
        }));
    }

    /**
     * Exporta clientes
     * @param {Array} customers - Clientes
     * @returns {Object} Dados formatados
     */
    formatCustomersExport(customers) {
        return customers.map(customer => ({
            'Cliente': customer.customer_name,
            'Email': customer.email || '-',
            'Total Compras': customer.total_purchases,
            'Valor Total Gasto': this.formatCurrency(customer.total_spent),
            'Ticket Médio': this.formatCurrency(customer.avg_ticket),
            'Última Compra': this.formatDate(customer.last_purchase)
        }));
    }

    /**
     * Exporta entregas
     * @param {Array} deliveries - Entregas
     * @returns {Object} Dados formatados
     */
    formatDeliveriesExport(deliveries) {
        return deliveries.map(delivery => ({
            'Cidade': delivery.city,
            'Bairro': delivery.neighborhood,
            'Total Entregas': delivery.delivery_count || delivery.total_deliveries,
            'Tempo Médio (min)': delivery.avg_delivery_minutes ? Math.round(delivery.avg_delivery_minutes) : '-',
            'Faturamento': this.formatCurrency(delivery.total_revenue)
        }));
    }

    /**
     * Formata valor monetário
     * @param {number} value - Valor
     * @returns {string} Valor formatado
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    }

    /**
     * Formata data
     * @param {string|Date} date - Data
     * @returns {string} Data formatada
     */
    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('pt-BR');
    }

    /**
     * Formata data e hora
     * @param {string|Date} datetime - Data/hora
     * @returns {string} Data/hora formatada
     */
    formatDateTime(datetime) {
        if (!datetime) return '-';
        const d = new Date(datetime);
        return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR')}`;
    }

    /**
     * Valida limite de registros
     * @param {number} count - Quantidade de registros
     * @throws {Error} Se exceder limite
     */
    validateExportLimit(count) {
        if (count > this.maxExportRecords) {
            throw new Error(`Limite de exportação excedido. Máximo: ${this.maxExportRecords} registros. Recebido: ${count}`);
        }
    }

    /**
     * Gera nome de arquivo com timestamp
     * @param {string} prefix - Prefixo do arquivo
     * @param {string} extension - Extensão (csv, xlsx, json)
     * @returns {string} Nome do arquivo
     */
    generateFilename(prefix, extension) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
        return `${prefix}_${timestamp}.${extension}`;
    }
}

export default new ExportService();