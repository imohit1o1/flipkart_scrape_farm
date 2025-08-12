import { Report } from '../models/index.js';
import { logger } from '../utils/index.js';
import { ENTITY_PREFIXES, LOG_ACTIONS, TASK_STATUS, SCRAPER_ITEMS } from '../constants.js';

// Helpers
const toDateOrNull = (value) => {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

const buildInitialSteps = () => ({
    request: {
        status: TASK_STATUS.ENQUEUED,
        attempts: 0,
        last_attempt_at: null,
        error: null,
    },
    download: {
        status: TASK_STATUS.PENDING,
        attempts: 0,
        scheduled_for: null,
        error: null,
    }
});

const buildInitialProgress = () => ({
    percent_complete: 0,
    status: TASK_STATUS.ENQUEUED,
    status_description: 'Job enqueued and waiting to start',
    stage: TASK_STATUS.PENDING,
    stage_description: 'Waiting to start operations',
    completed_steps: [],
    next_step: null,
    last_updated_at: new Date(),
});

// Map reportType -> predicate(requested_operations)
const I = SCRAPER_ITEMS.ITEMS;
const typePredicates = new Map([
    [I.LISTINGS.KEY, (ops) => ops?.listings?.enabled === true],
    [I.INVENTORY_REPORT.ALL_INVENTORY_REPORT, (ops) => ops?.inventory_report?.types?.all_inventory_report?.enabled === true],

    // Orders
    [I.ORDERS.RETURNS_ORDERS.KEY, (ops) => ops?.orders?.types?.returns_orders?.enabled === true || ops?.returns_orders?.enabled === true],
    [I.ORDERS.CANCELLED_ORDERS.KEY, (ops) => ops?.orders?.types?.cancelled_orders?.enabled === true || ops?.cancelled_orders?.enabled === true],
    [I.ORDERS.ACTIVE_ORDERS.PROCESSING_ORDERS, (ops) => ops?.orders?.types?.active_orders?.processing_orders?.enabled === true],
    [I.ORDERS.ACTIVE_ORDERS.DISPATCHED_ORDERS, (ops) => ops?.orders?.types?.active_orders?.dispatched_orders?.enabled === true],
    [I.ORDERS.ACTIVE_ORDERS.COMPLETED_ORDERS, (ops) => ops?.orders?.types?.active_orders?.completed_orders?.enabled === true],
    [I.ORDERS.ACTIVE_ORDERS.UPCOMING_ORDERS, (ops) => ops?.orders?.types?.active_orders?.upcoming_orders?.enabled === true],

    // Fulfilment report
    [I.FULFILMENT_REPORT.FULFILMENT_RETURN_REPORT, (ops) => ops?.fulfilment_report?.types?.fulfilment_return_report?.enabled === true],

    // Invoice
    [I.INVOICE_REPORT.KEY, (ops) => ops?.invoice_report?.enabled === true || ops?.invoice_report?.types?.invoice_report?.enabled === true],

    // Payments
    [I.PAYMENT_REPORT.FINANCIAL_REPORT, (ops) => ops?.payment_report?.types?.financial_report?.enabled === true],
    [I.PAYMENT_REPORT.SETTLED_TRANSACTIONS_REPORT, (ops) => ops?.payment_report?.types?.settled_transactions_report?.enabled === true],

    // Tax
    [I.TAX_REPORT.GST_REPORT, (ops) => ops?.tax_report?.types?.gst_report?.enabled === true],
    [I.TAX_REPORT.SALES_REPORT, (ops) => ops?.tax_report?.types?.sales_report?.enabled === true],
    [I.TAX_REPORT.TDS_REPORT, (ops) => ops?.tax_report?.types?.tds_report?.enabled === true],
]);

const extractEnabledReportTypes = (requested_operations = {}) => {
    const enabled = [];
    for (const [type, predicate] of typePredicates.entries()) {
        try {
            if (predicate(requested_operations)) enabled.push(type);
        } catch (_) {
            // Ignore predicate errors; treat as not enabled
        }
    }
    return enabled;
};

const upsertReport = async ({
    jobId,
    auth,
    reportType,
    parameters,
    enqueuedAt,
}) => {
    const startDate = toDateOrNull(parameters?.startDate);
    const endDate = toDateOrNull(parameters?.endDate);

    const doc = {
        job_id: jobId,
        seller_id: auth.seller_id,
        identifier: auth.identifier,
        password: auth.password ?? null,
        otp_login: Boolean(auth.otp_login),
        reportType,
        status: TASK_STATUS.ENQUEUED,
        enqueued_at: enqueuedAt ? toDateOrNull(enqueuedAt) : new Date(),
        parameters: {
            startDate: startDate ?? new Date(),
            endDate: endDate ?? new Date(),
        },
        steps: buildInitialSteps(),
        progress: buildInitialProgress(),
    };

    await Report.updateOne(
        { job_id: jobId, reportType },
        { $setOnInsert: doc },
        { upsert: true }
    );
};

const ReportService = {
    /**
     * Create one DB record per enabled report type for a manual job
     * @param {Object} jobData
     */
    createManualReports: async (jobData) => {
        const { job_id, auth, requested_operations, createdAt, parameters } = jobData;
        try {
            logger.info(`${ENTITY_PREFIXES.REPORT_CONTROLLER} ${LOG_ACTIONS.PROCESSING} Creating DB records for job ${job_id}`);

            const enabledTypes = extractEnabledReportTypes(requested_operations);
            for (const reportType of enabledTypes) {
                try {
                    await upsertReport({
                        jobId: job_id,
                        auth,
                        reportType,
                        parameters,
                        enqueuedAt: createdAt,
                    });
                    logger.info(`${ENTITY_PREFIXES.REPORT_CONTROLLER} ${LOG_ACTIONS.COMPLETED} Upserted record for ${job_id} - ${reportType}`);
                } catch (err) {
                    logger.error(`${ENTITY_PREFIXES.REPORT_CONTROLLER} ${LOG_ACTIONS.FAILED} Upsert failed for ${job_id} - ${reportType}: ${err.message}`);
                }
            }

            logger.info(`${ENTITY_PREFIXES.REPORT_CONTROLLER} ${LOG_ACTIONS.COMPLETED} DB records ready for job ${job_id}`);
        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.REPORT_CONTROLLER} ${LOG_ACTIONS.FAILED} Error creating DB records: ${error.message}`);
            throw error;
        }
    },
};

export { ReportService };