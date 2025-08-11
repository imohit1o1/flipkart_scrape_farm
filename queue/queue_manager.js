import { queueTypes, RETRY_DELAYS, ENTITY_PREFIXES, LOG_ACTIONS } from '../constants.js';
import { logger, FlipkartScraperError, TrackingManager, ServerMetricsManager } from './index.js';
import { ReportService } from '../services/index.js';

/**
 * 
 */
const QueueManager = {
    manualQueue: [],
    bulkQueue: [],
    allJobs: [],

    /**
     * Add a job to the appropriate queue and create database records
     * @param {string} type - queueTypes.MANUAL or queueTypes.BULK
     * @param {object} jobData - job payload (should have unique 'job_id')
     */
    async addToQueue(type, jobData) {
        try {
            // Add to queue first
            if (type === queueTypes.MANUAL) {
                this.manualQueue.push(jobData);
                logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.PROCESSING} Added job to manual queue: ${jobData.job_id}`);
            } else if (type === queueTypes.BULK) {
                this.bulkQueue.push(jobData);
                logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.PROCESSING} Added job to bulk queue: ${jobData.job_id}`);
            } else {
                logger.error(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.FAILED} Unknown queue type: ${type}`);
                throw new MeeshoScraperError('queue_manager_error', `Unknown queue type: ${type}`, jobData?.job_id);
            }

            // Create database records first and then tracking file
            await ReportService.createJobDatabaseRecords(jobData);
            await TrackingManager.ensureTrackingFileExists(jobData.auth, jobData.job_id, jobData.requested_operations);
            
            // Small delay to ensure all database records are fully created
            await new Promise(resolve => setTimeout(resolve, 100));

            // Update metrics after enqueuing
            ServerMetricsManager.updateTaskMetrics({ enqueuedJobs: [jobData.job_id] });

        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.FAILED} Error adding job to queue: ${error.message}`);
            throw error;
        }
    },

    /**
     * Add a job to the central allJobs array
     * @param {object} job - The job object to add (should have unique 'job_id')
     */
    addToAllJobs(job) {
        this.allJobs.push(job);
    },

    /**
     * Update a job's status and other fields in allJobs
     * @param {string} job_id - The job's unique id
     * @param {object} updates - Fields to update (e.g., { status: 'completed' })
     */
    updateJobStatus(job_id, updates) {
        const idx = this.allJobs.findIndex(j => j.job_id === job_id);
        if (idx !== -1) {
            this.allJobs[idx] = { ...this.allJobs[idx], ...updates };
        }
    },

    /**
     * Get the next job, prioritizing manual jobs
     * @returns {object|null} The next job or null if none
     */
    getNextJob() {
        let job = null;
        if (this.manualQueue.length > 0) {
            job = this.manualQueue.shift();
            logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.PROCESSING} Dequeued manual job: ${job?.job_id}`);
        } else if (this.bulkQueue.length > 0) {
            job = this.bulkQueue.shift();
            logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.PROCESSING} Dequeued bulk job: ${job?.job_id}`);
        }
        return job;
    },

    /**
     * Peek at the next job without removing it
     * @returns {object|null} The next job or null if none
     */
    peekNextJob() {
        if (this.manualQueue.length > 0) {
            return this.manualQueue[0];
        } else if (this.bulkQueue.length > 0) {
            return this.bulkQueue[0];
        }
        return null;
    },

    /**
     * Remove a job by id from both queues
     * @param {string|number} job_id - Unique job id
     * @returns {boolean} True if removed, false if not found
     */
    removeJobById(job_id) {
        let idx = this.manualQueue.findIndex(job => job.job_id === job_id);
        if (idx !== -1) {
            this.manualQueue.splice(idx, 1);
            logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.COMPLETED} Removed job from manual queue: ${job_id}`);
            return true;
        }
        idx = this.bulkQueue.findIndex(job => job.job_id === job_id);
        if (idx !== -1) {
            this.bulkQueue.splice(idx, 1);
            logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.COMPLETED} Removed job from bulk queue: ${job_id}`);
            return true;
        }
        logger.warn(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.WARNING} Job not found for removal: ${job_id}`);
        throw new MeeshoScraperError('queue_manager_error', `Job not found for removal: ${job_id}`, job_id);
    },

    /**
     * Clear all jobs from both queues
     */
    clearQueues() {
        this.manualQueue = [];
        this.bulkQueue = [];
        logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.COMPLETED} Cleared all queues`);
    },

    /**
     * Get stats for both queues
     * @returns {object} { manualQueueLength, bulkQueueLength, total }
     */
    getStats() {
        return {
            manualQueueLength: this.manualQueue.length,
            bulkQueueLength: this.bulkQueue.length,
            total: this.manualQueue.length + this.bulkQueue.length
        };
    },

    /**
     * Check if both queues are empty
     * @returns {boolean}
     */
    isEmpty() {
        return this.manualQueue.length === 0 && this.bulkQueue.length === 0;
    },

    /**
     * Get all jobs (manual, bulk, running, completed, failed, etc.)
     * @returns {Array} Array of all jobs
     */
    getAllJobs() {
        return [...this.allJobs];
    },

    /**
     * Get all jobs in a specific queue
     * @param {string} type - queueTypes.MANUAL or queueTypes.BULK
     * @returns {Array} Array of jobs in the specified queue
     */
    getJobsByType(type) {
        if (type === queueTypes.MANUAL) return [...this.manualQueue];
        if (type === queueTypes.BULK) return [...this.bulkQueue];
        logger.error(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.FAILED} Unknown queue type: ${type}`);
        throw new MeeshoScraperError('queue_manager_error', `Unknown queue type: ${type}`);
    },

    /**
     * Generates a job ID for a given identifier
     * @param {string} identifier - User identifier (email or mobile)
     * @returns {string} Job ID
     */
    generateJobId(identifier) {
        // Use sanitized identifier to ensure consistency with tracking system
        const sanitizedIdentifier = TrackingManager._sanitizeIdentifier(identifier);
        const generateRandomString = (length = 8) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            return Array.from(
                { length },
                () => chars.charAt(Math.floor(Math.random() * chars.length))
            ).join('');
        };
        const randomSuffix = generateRandomString(8);
        return `${sanitizedIdentifier}_${randomSuffix}`;
    },

    /**
     * Gets the delay for the next retry attempt
     * @returns {number} Delay in milliseconds
     */
    _getRetryDelay(attempt) {
        return RETRY_DELAYS[attempt];
    },

    /**
     * Cleans up retry tracking for a task
     * @param {string} jobId - Task ID
     */
    clearTask(jobId) {
        const identifier = jobId.split('_')[0];
        this._retryAttempts.delete(identifier);
        if (this._retryTimeouts.has(identifier)) {
            clearTimeout(this._retryTimeouts.get(identifier));
            this._retryTimeouts.delete(identifier);
        }
    }
};

export { QueueManager };
