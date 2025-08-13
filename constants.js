/**
 * Entity prefixes for logging
*/
export const ENTITY_PREFIXES = {
    SERVER: '[🖥️ Server]',
    APP: '[🌐 App]',
    API: '[🌐 API]',
    ROUTER: '[🛣️ Router]',
    DB: '[🗄️ DB]',
    SYSTEM_MONITOR: '[📈 SystemMonitor]',
    // Utils
    ELEMENT_FINDER: '[🔍 ElementFinder]',
    POPUP: '[💢 PopupHandler]',
    SCROLLER: '[📜 Scroller]',
    LOGIN_MANAGER: '[🔑 LoginManager]',
    DELAY_MANAGER: '[⏳ DelayManager]',
    RETRY_MECHANISM: '[🔄 RetryMechanism]',
    AUTO_DOWNLOAD: '[⏬ AutoDownload]',
    FLIPKART_REPORT_DB: '[🗄️ FlipkartReportDB]',
    // Managers
    VALIDATION_MANAGER: '[🕵️ ValidationManager]',
    PROXY_MANAGER: '[🛡️ ProxyManager]',
    QUEUE_MANAGER: '[📋 QueueManager]',
    TRACKING_MANAGER: '[📈 TrackingManager]',
    BROWSER_MANAGER: '[🌍 BrowserManager]',
    FILE_MANAGER: '[📁 FileManager]',
    WAREHOUSE_MANAGER: '[WarehouseManager]',
    // Services and Controllers
    PROGRESS_SERVICE: '[📈 ProgressService]',
    PROGRESS_CONTROLLER: '[🎮 ProgressController]',
    REPORT_CONTROLLER: '[🎮 ReportController]',
    STORJ_SERVICE: '[☁️ StorjService]',
    NAVIGATION_MANAGER: '[🏠 NavigationManager]',
};


/**
* Log actions for logging
*/
export const LOG_ACTIONS = {
    SETUP: '[🛠️ Setup]',
    PROCESSING: '[⚙️ Processing]',
    PROCESSED: '[✅ Processed]',
    WARNING: '[⚠️ Warning]',
    COMPLETED: '[🏁 Completed]',
    FAILED: '[❌ Failed]',
    CLICKED: '[🖱️ Clicked]',
    WAITING: '[⏳ Waiting]',
    SUBMITTED: '[📤 Submitted]',
    SCROLLING: '[📜 Scrolling]',
    ENQUEUED: '[📥 Enqueued]',
    DEQUEUED: '[📤 Dequeued]',
    STARTED: '[🚀 Started]',
    SHUTDOWN: '[🛑 Shutdown]',
    INFO: '[ℹ️ Info]',
    ERROR: '[🚨 Error]',
    NOT_FOUND: '[🔍 Not Found]',
    LOGGING_IN: '[🔑 Logging In]',
    NAVIGATING: '[🌐 Navigating]',
    CLOSED: '[🔒 Closed]',
    RETRY: '[🔁 Retry]',
    CONNECTED: '[✅ Connected]',
};

/**
 * System resource monitoring and batch sizing configuration
 */
export const SYSTEM_RESOURCE_CONFIG = {
    // Resource limit thresholds
    LIMITS: {
        MAX_CPU_USAGE_PERCENT: 80,
        MAX_MEMORY_USAGE_PERCENT: 85,
    },
    // Dynamic batch sizing thresholds
    BATCH_THRESHOLDS: {
        LOW_LOAD: { CPU: 50, MEMORY: 60 },
        MEDIUM_LOAD: { CPU: 70, MEMORY: 75 },
        HIGH_LOAD: { CPU: 80, MEMORY: 85 }
    },
    // Corresponding batch sizes
    BATCH_SIZES: {
        MAXIMUM: 20,
        STANDARD: 16,
        REDUCED: 12,
        MINIMUM: 8
    }
};

/**
* JSON parse limit
*/
export const JSON_PARSE_LIMIT = '10mb';

/**
 * Allowed scraper modes
 */
export const SCRAPER_MODES = {
    AUTO: 'auto',
    DOWNLOAD: 'download',
    REQUEST: 'request',
};

/**
 * Scrapers items
 */
export const SCRAPER_ITEMS = {
    ITEMS: {
        LISTINGS: {
            KEY: 'listings',
            LISTINGS: 'listings'
        },
        INVENTORY_REPORT: {
            KEY: "inventoy_report",
            INVENTORY_REPORT: "inventory_report"
        },
        ORDERS_REPORT: {
            KEY: 'orders_report',
            ACTIVE_ORDERS_REPORT: {
                KEY: 'active_orders_report',
                DISPATCHED_ORDERS_REPORT: 'dispatched_orders_report',
                COMPLETED_ORDERS_REPORT: 'completed_orders_report',
                UPCOMING_ORDERS_REPORT: 'upcoming_orders_report',
            },
            RETURNS_ORDERS_REPORT: {
                KEY: 'returns_orders_report',
            },
            CANCELLED_ORDERS_REPORT: {
                KEY: 'cancelled_orders_report',
            },
        },
        FULFILMENT_REPORT: {
            KEY: 'fulfilment_report',
            FULFILMENT_RETURN_REPORT: 'fulfilment_return_report'
        },
        INVOICE_REPORT: {
            KEY: 'invoice_report',
            COMMISSION_INVOICE_REPORT: 'commission_invoice_report'
        },
        PAYMENT_REPORT: {
            KEY: 'payment_report',
            FINANCIAL_YEARLY_REPORT: 'financial_yearly_report',
            SETTLED_TRANSACTIONS_REPORT: 'settled_transactions_report',
        },
        TAX_REPORT: {
            KEY: 'tax_report',
            GST_REPORT: 'gst_report',
            SALES_REPORT: 'sales_report',
            TDS_REPORT: 'tds_report',
        },
    }
}

/**
 * Task status
*/
export const TASK_STATUS = {
    ENQUEUED: "enqueued",
    IN_PROGRESS: "in_progress",
    COMPLETED: "completed",
    PENDING: "pending",
    FAILED: "failed",
    COOLDOWN: "cooldown",
    RETRYING: "retrying",
}


/**
 * Queue Types
 */
export const queueTypes = {
    MANUAL: "manual",
    BULK: "bulk"
}


/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
    MAX_RETRIES_ATTEMPTS: 3,
    RETRY_DELAYS_MS: [60000, 180000, 300000], // 1 min, 3 min, 5 min in ms
    ATTEMPTS: {
        ATTEMPT_1: 1,
        ATTEMPT_2: 2,
        ATTEMPT_3: 3,
    }
}

/**
 * Dispatcher interval
 */
export const DISPATCH_INTERVAL_MS = 1000; // 1 second between dispatch cycles

/**
 * Step names for tracking
 */
export const PHASES = {
    REQUEST: "request",
    DOWNLOAD: "download",
    DIRECT_DOWNLOAD: "direct_download"
}


/**
 * Delay between phases
 */
export const AUTO_DOWNLOAD_COOLDOWN_MS = 1 * 60 * 1000; // 1 minute


/**
 * Timeout values
 */
export const TIMEOUT_MS = {
    LOGIN_POPUP: 10000, // 10 seconds
    DOWNLOAD_BUTTON: 10000, // 10 seconds
    NAVIGATION: 30000, // 30 seconds
}

/**
 * Download URLs
 */
export const DOWNLOAD_URLS = {
    FLIPKART_STORAGE_REPORTS: 'https://api.flipkart.net/storage/reports'
}


