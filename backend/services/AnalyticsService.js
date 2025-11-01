import analyticsService from '../services/AnalyticsService.js';
import filterService from '../services/FilterService.js';
import exportService from '../services/ExportService.js';
import logger from '../utils/logger.js';
import { asyncHandler } from '../utils/errorHandler.js';

export class AnalyticsController {
    getSalesAnalytics = asyncHandler(async (req, res) => {
        const filters = filterService.validateFilters(req.query);
        logger.info('Request: Sales Analytics', { filters });
        
        const data = await analyticsService.getSalesAnalytics(filters);
        
        res.json({
            success: true,
            data,
            filters
        });
    });
    
    exportData = asyncHandler(async (req, res) => {
        const { type = 'sales', format = 'csv' } = req.body;
        const filters = filterService.validateFilters(req.body.filters || {});
        
        logger.info('Request: Export Data', { type, format, filters });
        
        const data = await analyticsService.getExportData(type, filters, 10000);
        exportService.validateExportLimit(data.length);
        
        let content, contentType, filename;
        
        if (format === 'csv') {
            const columns = exportService.getSalesColumns();
            const formatted = exportService.formatSalesExport(data);
            content = exportService.toCSV(formatted, columns);
            contentType = 'text/csv; charset=utf-8';
            filename = `export_${type}_${Date.now()}.csv`;
        } else {
            content = JSON.stringify(data, null, 2);
            contentType = 'application/json';
            filename = `export_${type}_${Date.now()}.json`;
        }
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);
    });
    
    // Adicione os demais endpoints usando asyncHandler
}

export default new AnalyticsController();