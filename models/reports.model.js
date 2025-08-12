import { Schema, model } from 'mongoose';
import { SCRAPER_ITEMS, TASK_STATUS } from '../constants.js';

// Reusable sub-schema for request/download steps
const StepsSchema = new Schema({
    request: {
        status: {
            type: String,
            enum: Object.values(TASK_STATUS),
            default: TASK_STATUS.PENDING
        },
        attempts: {
            type: Number,
            default: 0,
        },
        last_attempt_at: {
            type: Date,
            default: null
        },
        error: {
            type: String,
            default: null
        }
    },
    download: {
        status: {
            type: String,
            enum: Object.values(TASK_STATUS),
            default: TASK_STATUS.PENDING
        },
        attempts: {
            type: Number,
            default: 0,
        },
        scheduled_for: { type: Date, default: null },
        error: { type: String, default: null }
    }
}, { _id: false });

const ReportSchema = new Schema({
    // Core identification fields
    job_id: {
        type: String,
        required: [true, 'Job ID is required'],
    },
    seller_id: {
        type: String,
        required: [true, 'Seller ID is required'],
    },
    identifier: {
        type: String,
        required: [true, 'Identifier is required'],
    },
    password: {
        type: String,
        default: null
    },
    otp_login: {
        type: Boolean,
        default: false
    },
    // Report classification
    reportType: {
        type: String,
        required: [true, 'Report type is required'],
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
        ]
    },

    // Overall status
    status: {
        type: String,
        required: [true, 'Status is required'],
        enum: Object.values(TASK_STATUS),
    },

    // Timestamps
    enqueued_at: {
        type: Date,
        default: null
    },
    started_at: {
        type: Date,
        default: null
    },
    completed_at: {
        type: Date,
        default: null
    },

    // Report parameters
    parameters: {
        // Date range for reports that need it
        startDate: {
            type: Date,
            required: [true, 'Start date is required']
        },
        endDate: {
            type: Date,
            required: [true, 'End date is required']
        }
    },

    // Request and Download status tracking - applies to ALL reports
    steps: {
        type: StepsSchema,
    },

    // Progress tracking - mirrors the tracking system structure
    progress: {
        percent_complete: {
            type: Number,
            default: 0,
            max: 100
        },
        status: {
            type: String,
            enum: Object.values(TASK_STATUS),
            default: TASK_STATUS.PENDING
        },
        status_description: {
            type: String,
            default: ''
        },
        stage: {
            type: String,
            enum: Object.values(TASK_STATUS),
            default: TASK_STATUS.PENDING
        },
        stage_description: {
            type: String,
            default: ''
        },
        completed_steps: [{
            type: Schema.Types.Mixed, // Use Mixed type to handle objects
            default: []
        }],
        next_step: {
            type: Schema.Types.Mixed, // Use Mixed type to handle object structure
            default: null
        },
        last_updated_at: {
            type: Date,
            default: Date.now
        },
    },
    // Multiple files support for ZIP extracts
    files: [{
        _id: false, // Disable automatic _id generation for subdocuments
        file_name: {
            type: String,
            required: false  // Make it optional, can be null
        },
        warehouse_name: {
            type: String,
            required: false  // Make it optional
        },
        download_url: {
            type: String
        },
        storj_url: {
            type: String
        },
        file_size: {
            type: Number
        },
        uploaded_at: {
            type: Date,
            default: Date.now
        }
    }],

}, {
    timestamps: true
});

// Indexes for better query performance
ReportSchema.index({ job_id: 1 });
ReportSchema.index({ identifier: 1 });
ReportSchema.index({ seller_id: 1, reportType: 1 });
ReportSchema.index({ status: 1, createdAt: -1 });
ReportSchema.index({ identifier: 1, reportType: 1 });
ReportSchema.index({ 'files.warehouse_name': 1 });

const Report = model('report', ReportSchema);

export { Report };
