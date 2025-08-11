import { Schema, model } from 'mongoose';
import { SCRAPER_ITEMS } from '../constants.js';

const ReportTypeSchema = new Schema({
    // Report type (from SCRAPER_ITEMS constants)
    type: {
        type: String,
        required: true,
        enum: [
            // Listings / Inventory
            SCRAPER_ITEMS.ITEMS.LISTINGS.KEY,
            SCRAPER_ITEMS.ITEMS.INVENTORY_REPORT.ALL_INVENTORY_REPORT,

            // Orders (top-level)
            SCRAPER_ITEMS.ITEMS.ORDERS.RETURNS_ORDERS.KEY,
            SCRAPER_ITEMS.ITEMS.ORDERS.CANCELLED_ORDERS.KEY,
            SCRAPER_ITEMS.ITEMS.ORDERS.ACTIVE_ORDERS.PROCESSING_ORDERS,
            SCRAPER_ITEMS.ITEMS.ORDERS.ACTIVE_ORDERS.DISPATCHED_ORDERS,
            SCRAPER_ITEMS.ITEMS.ORDERS.ACTIVE_ORDERS.COMPLETED_ORDERS,
            SCRAPER_ITEMS.ITEMS.ORDERS.ACTIVE_ORDERS.UPCOMING_ORDERS,


            // Fulfilment reports
            SCRAPER_ITEMS.ITEMS.FULFILMENT_REPORT.FULFILMENT_RETURN_REPORT,

            // Invoice
            SCRAPER_ITEMS.ITEMS.INVOICE_REPORT.KEY,

            // Payments
            SCRAPER_ITEMS.ITEMS.PAYMENT_REPORT.FINANCIAL_REPORT,
            SCRAPER_ITEMS.ITEMS.PAYMENT_REPORT.SETTLED_TRANSACTIONS_REPORT,

            // Tax
            SCRAPER_ITEMS.ITEMS.TAX_REPORT.GST_REPORT,
            SCRAPER_ITEMS.ITEMS.TAX_REPORT.SALES_REPORT,
            SCRAPER_ITEMS.ITEMS.TAX_REPORT.TDS_REPORT,
        ],
        index: true
    },

    // Active status flag
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },

    // Description of the report type
    description: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Indexes for better query performance
ReportTypeSchema.index({ type: 1, isActive: 1 });

const ReportType = model('report_type', ReportTypeSchema);
export { ReportType };
