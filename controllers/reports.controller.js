import { logger, ApiResponse, QueueUtils } from '../utils/index.js';
import { QueueManager } from '../queue/index.js';
import { ENTITY_PREFIXES, LOG_ACTIONS, queueTypes, STEP_NAMES, TASK_STATUS } from '../constants.js';

const ReportController = {
    /**
     * Scrape manual users
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} - Response object
     */
    scrapeManual: async (req, res) => {
        try {
            const { auth, requested_operations } = req.body;
            logger.info(`${ENTITY_PREFIXES.REPORT_CONTROLLER} ${LOG_ACTIONS.PROCESSING} Scraping manual request received for seller: ${auth.identifier}`);

            // Generate job ID
            const jobId = QueueUtils.generateJobId(auth.identifier);
            logger.info(`${ENTITY_PREFIXES.REPORT_CONTROLLER} ${LOG_ACTIONS.SUBMITTED} Manual scrape request received for seller: ${auth.identifier}`);

            // Add job to manual queue using the correct syntax
            const job = await QueueManager.addToQueue(queueTypes.MANUAL, {
                job_id: jobId,
                auth,
                requested_operations,
                operation_mode: STEP_NAMES.REQUEST,
                status: TASK_STATUS.ENQUEUED,
                createdAt: new Date().toISOString()
            });

            logger.info(`${ENTITY_PREFIXES.REPORT_CONTROLLER} ${LOG_ACTIONS.ENQUEUED} Job ${job.jobId} added to manual queue`);

            // Immediately send success response
            return ApiResponse(res, 202, 'Scraping job has been queued successfully', {
                jobId: job.jobId,
                status: job.status,
                seller_id: job.seller_id,
                reportType: job.reportType,
                enqueuedAt: job.enqueued_at,
                queuePosition: QueueManager.getQueueStatus().manualQueueLength,
                processing: QueueManager.getQueueStatus().inFlightCount > 0
            });

        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.REPORT_CONTROLLER} ${LOG_ACTIONS.FAILED} Error in scrapeManual:`, error);

            return ApiResponse(res, 500, 'Failed to queue scraping job', { error: 'QUEUE_ENQUEUE_ERROR', details: { message: error.message } });
        }
    },

    /**
     * Scrape bulk users
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} - Response object
     */
    scrapeBulk: async (req, res) => {
        try {
            const { auth, requested_operations } = req.body;
        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.REPORT_CONTROLLER} ${LOG_ACTIONS.FAILED} Error in scrapeBulk:`, error);
        }
    },
};


export { ReportController };
