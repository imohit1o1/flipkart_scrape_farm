import { ApiError, logger } from '../utils/index.js';
import { SystemMonitorService } from '../services/system_monitor.service.js';
import { ENTITY_PREFIXES, LOG_ACTIONS, queueTypes, STEP_NAMES, TASK_STATUS, SYSTEM_RESOURCE_CONFIG, DISPATCH_INTERVAL_MS } from '../constants.js';
import { ReportService } from '../services/report.service.js';
import os from 'os';

    // ===== STATE MANAGEMENT =====
const state = {
    manualQueue: [],
    bulkQueue: [],
    inFlightJobs: new Map(),
    workerThreads: [],
    browserCluster: null,
    resourceMonitor: null,
    isProcessing: false,

    // Configuration
    pollingInterval: 1000,
    databaseUpdateInterval: 5000
};

const QueueManager = {

    // ===== UTILITY FUNCTIONS =====

    /**
     * Check if job already exists in any queue
     * @param {string} jobId - Job ID to check
     * @returns {boolean} True if job exists
     */
    isJobDuplicate: (jobId) => {
        return state.manualQueue.some(job => job.job_id === jobId) ||
            state.bulkQueue.some(job => job.job_id === jobId) ||
            state.inFlightJobs.has(jobId);
    },

    // ===== RESOURCE MONITORING =====

    /**
     * Check current resource limits using systemMonitor.canSpawnMoreHeavyTasks
     * @returns {Promise<boolean>} True if resources are within limits
     */
    checkResourceLimits: async () => {
        try {
            return await SystemMonitorService.canSpawnMoreWorkers();
        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.ERROR} Resource check failed:`, error);
            return false;
        }
    },

    /**
     * Get optimal batch size based on current resources using systemMonitor.getOptimalBatchSize
     * @returns {Promise<number>} Optimal batch size
     */
    getOptimalBatchSize: async () => {
        try {
            const suggested = await SystemMonitorService.getOptimalBatchSize();
            return Math.max(state.minBatchSize, Math.min(state.maxBatchSize, suggested));
        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.ERROR} Batch size calculation failed:`, error);
            return state.currentBatchSize;
        }
    },

    /**
     * Monitor resources in real-time using systemMonitor.monitorResources
     * @returns {Promise<Object>} Current resource status
     */
    monitorResources: async () => {
        try {
            return await SystemMonitorService.getSystemSnapshot();
        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.ERROR} Resource monitoring failed:`, error);
            return null;
        }
    },
    // ===== ENQUEUE OPERATIONS =====

    /**
     * Add job to specific queue
     * @param {string} queueType - Queue type (manual/bulk)
     * @param {Object} jobData - Job data
     * @returns {Object} Enriched job
     */
    addToQueue: async (queueType, jobData) => {
        try {
            const jobId = jobData.job_id || QueueUtils.generateJobId(jobData.auth?.identifier ?? 'unknown');

            if (QueueManager.isJobDuplicate(jobId)) {
                throw new Error(`Job ${jobId} already exists`);
            }

            const enrichedJob = {
                job_id: jobId,
                jobId, // compatibility for existing controller response
                auth: jobData.auth,
                seller_id: jobData.auth?.seller_id,
                reportType: jobData.reportType,
                parameters: jobData.parameters,
                requested_operations: jobData.requested_operations,
                operation_steps: jobData.operation_steps || STEP_NAMES.REQUEST,
                status: TASK_STATUS.ENQUEUED,
                enqueued_at: new Date().toISOString(),
            };

            if (queueType === queueTypes.MANUAL) {
                state.manualQueue.unshift(enrichedJob); // priority
                logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.ENQUEUED} Job ${jobId} added to manual queue`);
            } else if (queueType === queueTypes.BULK) {
                state.bulkQueue.push(enrichedJob);
                logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.ENQUEUED} Job ${jobId} added to bulk queue`);
            } else {
                throw new ApiError('queue_manager_error', `Unknown queue type: ${queueType}`, jobId);
            }

            // Persist DB records for enabled types if provided
            if (enrichedJob.requested_operations) {
                await ReportService.createManualReports({
                    job_id: enrichedJob.job_id,
                    auth: enrichedJob.auth,
                    requested_operations: enrichedJob.requested_operations,
                    createdAt: enrichedJob.createdAt,
                    parameters: enrichedJob.parameters,
                });
            }

            // Small delay to ensure DB writes complete before returning
            await new Promise(resolve => setTimeout(resolve, DISPATCH_INTERVAL_MS));

            return enrichedJob;
        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.FAILED} Failed to add job to queue:`, error);
            throw new ApiError('queue_manager_error', `Failed to add job to queue: ${error.message}`, jobData?.job_id);
        }
    },

    // ===== PROCESSING OPERATIONS =====

    /**
     * Get next batch of jobs for processing
     * @returns {Promise<Array>} Batch of jobs
     */
    getNextBatch: async () => {
        const batch = [];
        const optimalBatchSize = await QueueManager.getOptimalBatchSize();

        // Process manual queue first (priority)
        while (batch.length < optimalBatchSize && state.manualQueue.length > 0) {
            batch.push(state.manualQueue.shift());
        }

        // Then process bulk queue
        while (batch.length < optimalBatchSize && state.bulkQueue.length > 0) {
            batch.push(state.bulkQueue.shift());
        }

        return batch;
    },
    /**
     * Process a batch of jobs
     * @param {Array} batch - Batch of jobs to process
     * @returns {Promise<void>}
     */
    processBatch: async (batch) => {
        if (batch.length === 0) return;

        logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.PROCESSING} Processing batch of ${batch.length} jobs`);

        for (const job of batch) {
            try {
                // Mark job as in progress
                job.status = TASK_STATUS.IN_PROGRESS;
                job.startedAt = new Date().toISOString();
                state.inFlightJobs.set(job.job_id, job);

                // TODO: Send job to worker thread for processing
                logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.PROCESSING} Job ${job.job_id} started processing`);

            } catch (error) {
                logger.error(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.FAILED} Job ${job.job_id} failed to start:`, error);
                markJobFailed(job.job_id, error);
            }
        }
    },

    /**
     * Mark job as completed
     * @param {string} jobId - Job ID
     * @param {Object} result - Job result
     * @returns {Object} Updated job
     */
    markJobCompleted: (jobId, result) => {
        const job = state.inFlightJobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found in flight`);
        }

        job.status = TASK_STATUS.COMPLETED;
        job.completedAt = new Date().toISOString();
        job.result = result;

        state.inFlightJobs.delete(jobId);

        logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.COMPLETED} Job ${jobId} completed successfully`);

        return job;
    },

    /**
     * Mark job as failed
     * @param {string} jobId - Job ID
     * @param {Error} error - Error details
     * @returns {Object} Updated job
     */
    markJobFailed: (jobId, error) => {
        const job = state.inFlightJobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found in flight`);
        }

        job.status = TASK_STATUS.FAILED;
        job.completedAt = new Date().toISOString();
        job.error = error.message;
        job.attempts++;

        state.inFlightJobs.delete(jobId);

        logger.error(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.FAILED} Job ${jobId} failed:`, error);

        return job;
    },

    // ===== MONITORING OPERATIONS =====

    /**
     * Get current queue status
     * @returns {Object} Queue status information
     */
    getQueueStatus: () => {
        return {
            manualQueueLength: state.manualQueue.length,
            bulkQueueLength: state.bulkQueue.length,
            inFlightCount: state.inFlightJobs.size,
            totalJobs: state.manualQueue.length + state.bulkQueue.length + state.inFlightJobs.size,
            isProcessing: state.isProcessing,
            currentWorkerThreads: state.currentWorkerThreads,
            currentBatchSize: state.currentBatchSize,
            timestamp: new Date().toISOString()
        };
    },

    /**
     * Get current resource status
     * @returns {Promise<Object>} Resource status
     */
    getResourceStatus: async () => {
        return await QueueManager.monitorResources();
    },

    /**
     * Get specific job status
     * @param {string} jobId - Job ID
     * @returns {Object|null} Job status or null if not found
     */
    getJobStatus: (jobId) => {
        // Check in-flight jobs first
        if (state.inFlightJobs.has(jobId)) {
            return state.inFlightJobs.get(jobId);
        }

        // Check manual queue
        const manualJob = state.manualQueue.find(job => job.job_id === jobId);
        if (manualJob) return manualJob;

        // Check bulk queue
        const bulkJob = state.bulkQueue.find(job => job.job_id === jobId);
        if (bulkJob) return bulkJob;

        return null;
    },

    // ===== WORKER THREAD OPERATIONS =====

    /**
     * Initialize dynamic worker threads based on CPU load
     * @returns {Promise<void>}
     */
    initializeWorkerThreads: async () => {
        try {
            const systemSnapshot = await SystemMonitorService.getSystemSnapshot();
            const cpuCount = os.cpus().length;
            
            // Calculate optimal worker threads based on CPU load
            const cpuLoad = systemSnapshot.cpu.current;
            const availableCpu = Math.max(state.minWorkerThreads, 
                Math.min(state.maxWorkerThreads, 
                    Math.floor(cpuCount * (1 - cpuLoad / 100))));
            
            state.currentWorkerThreads = availableCpu;
            state.currentBatchSize = await QueueManager.getOptimalBatchSize();
            
            logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.SETUP} Initializing ${availableCpu} worker threads based on CPU load: ${cpuLoad}%`);
            logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.SETUP} Optimal batch size: ${state.currentBatchSize}`);
            
        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.ERROR} Failed to initialize worker threads:`, error);
            // Fallback to defaults
            state.currentWorkerThreads = 4;
            state.currentBatchSize = 16;
        }
    },

    /**
     * Distribute job to available thread
     * @param {Object} job - Job to distribute
     * @returns {Promise<void>}
     */
    distributeJob: async (job) => {
        // TODO: Implement job distribution to worker threads
        logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.PROCESSING} Distributing job ${job.job_id} to worker thread`);
    },

    /**
     * Handle thread failure
     * @param {string} threadId - Thread ID that failed
     * @returns {Promise<void>}
     */
    handleThreadFailure: async (threadId) => {
        logger.error(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.FAILED} Worker thread ${threadId} failed`);

        // TODO: Implement thread failure handling
        // This will be implemented when we add worker thread support
    },

    // ===== DATABASE OPERATIONS =====

    /**
     * Persist job to database
     * @param {Object} jobData - Job data to persist
     * @returns {Promise<void>}
     */
    persistJob: async (jobData) => {
        // TODO: Implement database persistence
        logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.PROCESSING} Persisting job ${jobData.job_id} to database`);
    },

    /**
     * Update job status in database
     * @param {string} jobId - Job ID
     * @param {string} status - New status
     * @returns {Promise<void>}
     */
    updateJobStatus: async (jobId, status) => {
        // TODO: Implement database status update
        logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.PROCESSING} Updating job ${jobId} status to ${status} in database`);
    },

    /**
     * Get job history from database
     * @param {Object} filters - Filter criteria
     * @returns {Promise<Array>} Job history
     */
    getJobHistory: async (filters = {}) => {
        // TODO: Implement database job history retrieval
        logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.INFO} Retrieving job history with filters:`, filters);
        return [];
    },

    // ===== UTILITY OPERATIONS =====

    /**
     * Cleanup completed jobs
     * @returns {Promise<void>}
     */
    cleanupCompletedJobs: async () => {
        // TODO: Implement cleanup of old completed jobs
        logger.info(`${ENTITY_PREFIXES.QUEUE_MANAGER} ${LOG_ACTIONS.PROCESSING} Cleaning up completed jobs`);
    },


};


export { QueueManager };
