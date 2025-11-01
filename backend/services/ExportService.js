// ========== backend/services/ExportService.js - COMPLETO ==========
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
    
    /**
     * Converte para CSV com suporte Excel UTF-8
     */
    toCSV(data, columns) {
        if (!data || data.length === 0) return '';
        
        const header = columns.map(c => c.label).join(',');
        const rows = data.map(row => {
            return columns.map(col => {
                let value = row[col.key];
                
                if (value === null || value === undefined) return '';
                
                switch (col.type) {
                    case 'currency':
                        value = this.formatCurrency(value);
                        break;
                    case 'date':
                        value = this.formatDate(value);
                        break;
                    case 'datetime':
                        value = this.formatDateTime(value);
                        break;
                }
                
                const str = String(value);
                if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                    return `"${str.replace(/"/g, '""')}"`;
                }
                return str;
            }).join(',');
        });
        
        return '\uFEFF' + [header, ...rows].join('\n');
    }

    /**
     * Converte para JSON formatado
     */
    toJSON(data) {
        return JSON.stringify(data, null, 2);
    }
    
    /**
     * Formata vendas para exportação
     */
    formatSalesExport(sales) {
        return sales.map(sale => ({
            id: sale.id,
            data: this.formatDateTime(sale.created_at),
            cliente: sale.customer_name || 'Anônimo',
            email: sale.email || '-',
            loja: sale.store_name,
            cidade: sale.store_city,
            canal: sale.channel_name,
            status: sale.sale_status_desc,
            valor_itens: parseFloat(sale.total_amount_items || 0),
            desconto: parseFloat(sale.total_discount || 0),
            taxa_entrega: parseFloat(sale.delivery_fee || 0),
            taxa_servico: parseFloat(sale.service_tax_fee || 0),
            valor_total: parseFloat(sale.total_amount || 0),
            tempo_producao: sale.production_seconds ? Math.round(sale.production_seconds / 60) : null,
            tempo_entrega: sale.delivery_seconds ? Math.round(sale.delivery_seconds / 60) : null
        }));
    }

    /**
     * Formata produtos para exportação
     */
    formatProductsExport(products) {
        return products.map(product => ({
            id: product.id,
            produto: product.product_name || product.name,
            categoria: product.category_name || '-',
            vezes_vendido: product.times_sold || 0,
            quantidade_total: product.total_quantity || 0,
            faturamento: parseFloat(product.total_revenue || 0),
            preco_medio: parseFloat(product.avg_price || 0)
        }));
    }

    /**
     * Formata clientes para exportação
     */
    formatCustomersExport(customers) {
        return customers.map(customer => ({
            id: customer.id,
            nome: customer.customer_name,
            email: customer.email || '-',
            total_compras: customer.total_purchases || 0,
            valor_total: parseFloat(customer.total_spent || 0),
            ticket_medio: parseFloat(customer.avg_ticket || 0),
            ultima_compra: this.formatDate(customer.last_purchase)
        }));
    }

    /**
     * Formata entregas para exportação
     */
    formatDeliveriesExport(deliveries) {
        return deliveries.map(delivery => ({
            cidade: delivery.city,
            bairro: delivery.neighborhood,
            total_entregas: delivery.delivery_count || delivery.total_deliveries || 0,
            faturamento: parseFloat(delivery.total_revenue || 0),
            tempo_medio: delivery.avg_delivery_minutes ? Math.round(delivery.avg_delivery_minutes) : null
        }));
    }

    /**
     * Colunas para vendas
     */
    getSalesColumns() {
        return [
            { key: 'id', label: 'ID', type: 'number' },
            { key: 'data', label: 'Data/Hora', type: 'datetime' },
            { key: 'cliente', label: 'Cliente', type: 'string' },
            { key: 'email', label: 'Email', type: 'string' },
            { key: 'loja', label: 'Loja', type: 'string' },
            { key: 'cidade', label: 'Cidade', type: 'string' },
            { key: 'canal', label: 'Canal', type: 'string' },
            { key: 'status', label: 'Status', type: 'string' },
            { key: 'valor_itens', label: 'Valor Itens', type: 'currency' },
            { key: 'desconto', label: 'Desconto', type: 'currency' },
            { key: 'taxa_entrega', label: 'Taxa Entrega', type: 'currency' },
            { key: 'taxa_servico', label: 'Taxa Serviço', type: 'currency' },
            { key: 'valor_total', label: 'Valor Total', type: 'currency' },
            { key: 'tempo_producao', label: 'Tempo Produção (min)', type: 'number' },
            { key: 'tempo_entrega', label: 'Tempo Entrega (min)', type: 'number' }
        ];
    }

    /**
     * Colunas para produtos
     */
    getProductsColumns() {
        return [
            { key: 'id', label: 'ID', type: 'number' },
            { key: 'produto', label: 'Produto', type: 'string' },
            { key: 'categoria', label: 'Categoria', type: 'string' },
            { key: 'vezes_vendido', label: 'Vezes Vendido', type: 'number' },
            { key: 'quantidade_total', label: 'Quantidade Total', type: 'number' },
            { key: 'faturamento', label: 'Faturamento', type: 'currency' },
            { key: 'preco_medio', label: 'Preço Médio', type: 'currency' }
        ];
    }

    /**
     * Colunas para clientes
     */
    getCustomersColumns() {
        return [
            { key: 'id', label: 'ID', type: 'number' },
            { key: 'nome', label: 'Nome', type: 'string' },
            { key: 'email', label: 'Email', type: 'string' },
            { key: 'total_compras', label: 'Total Compras', type: 'number' },
            { key: 'valor_total', label: 'Valor Total', type: 'currency' },
            { key: 'ticket_medio', label: 'Ticket Médio', type: 'currency' },
            { key: 'ultima_compra', label: 'Última Compra', type: 'date' }
        ];
    }

    /**
     * Colunas para entregas
     */
    getDeliveriesColumns() {
        return [
            { key: 'cidade', label: 'Cidade', type: 'string' },
            { key: 'bairro', label: 'Bairro', type: 'string' },
            { key: 'total_entregas', label: 'Total Entregas', type: 'number' },
            { key: 'faturamento', label: 'Faturamento', type: 'currency' },
            { key: 'tempo_medio', label: 'Tempo Médio (min)', type: 'number' }
        ];
    }

    /**
     * Gera nome de arquivo
     */
    generateFilename(type, format) {
        const date = new Date().toISOString().split('T')[0];
        const time = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
        return `export_${type}_${date}_${time}.${format}`;
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

    formatDateTime(date) {
        if (!date) return '-';
        const d = new Date(date);
        return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR')}`;
    }
}

export default new ExportService();