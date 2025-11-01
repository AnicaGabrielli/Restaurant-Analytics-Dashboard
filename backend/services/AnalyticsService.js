// ========== backend/services/AnalyticsService.js ==========
import { Sale } from '../models/Sale.js';
import { Product } from '../models/Product.js';
import { Item } from '../models/Item.js';
import { Customer } from '../models/Customer.js';
import { Delivery } from '../models/Delivery.js';

export class AnalyticsService {
    constructor() {
        this.saleModel = new Sale();
        this.productModel = new Product();
        this.itemModel = new Item();
        this.customerModel = new Customer();
        this.deliveryModel = new Delivery();
    }

    async getDashboardOverview() {
        const [
            revenue,
            salesByPeriod,
            salesByChannel,
            topProducts,
            topItems,
            productionTime,
            deliveryTime
        ] = await Promise.all([
            this.saleModel.getTotalRevenue(),
            this.saleModel.getSalesByPeriod('day', 30),
            this.saleModel.getSalesByChannel(),
            this.productModel.getTopSellingProducts(10),
            this.itemModel.getTopItems(10),
            this.saleModel.getAverageProductionTime(),
            this.saleModel.getAverageDeliveryTime()
        ]);

        return {
            revenue,
            salesByPeriod,
            salesByChannel,
            topProducts,
            topItems,
            operationalMetrics: {
                production: productionTime,
                delivery: deliveryTime
            }
        };
    }

    async getSalesAnalytics() {
        const [
            byChannel,
            byStore,
            byHour,
            byWeekday,
            cancellationRate
        ] = await Promise.all([
            this.saleModel.getSalesByChannel(),
            this.saleModel.getSalesByStore(15),
            this.saleModel.getSalesByHour(),
            this.saleModel.getSalesByWeekday(),
            this.saleModel.getCancellationRate()
        ]);

        return {
            byChannel,
            byStore,
            byHour,
            byWeekday,
            cancellationRate
        };
    }

    async getProductAnalytics() {
        const [
            topProducts,
            byCategory,
            mostCustomized
        ] = await Promise.all([
            this.productModel.getTopSellingProducts(20),
            this.productModel.getProductsByCategory(),
            this.productModel.getMostCustomizedProducts(15)
        ]);

        return {
            topProducts,
            byCategory,
            mostCustomized
        };
    }

    async getCustomerAnalytics() {
        const [
            retention,
            topCustomers,
            newVsReturning
        ] = await Promise.all([
            this.customerModel.getCustomerRetention(),
            this.customerModel.getTopCustomers(15),
            this.customerModel.getNewVsReturning()
        ]);

        return {
            retention,
            topCustomers,
            newVsReturning
        };
    }

    async getDeliveryAnalytics() {
        const [
            byRegion,
            stats,
            topNeighborhoods
        ] = await Promise.all([
            this.deliveryModel.getDeliveryPerformanceByRegion(),
            this.deliveryModel.getDeliveryStats(),
            this.deliveryModel.getTopDeliveryNeighborhoods(15)
        ]);

        return {
            byRegion,
            stats,
            topNeighborhoods
        };
    }
}