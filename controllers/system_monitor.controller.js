import { logger, ApiResponse } from '../utils/index.js';
import { SystemMonitorService } from '../services/index.js';
import { ENTITY_PREFIXES, LOG_ACTIONS } from '../constants.js';

const SystemMonitorController = {
    /**
     * Get current CPU usage
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} - Response object
     */
    getCpuUsage: async (req, res) => {
        try {
            logger.info(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.PROCESSING} CPU usage request`);
            
            const cpuUsage = await SystemMonitorService.getCurrentCpuUsage();
            
            logger.info(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.COMPLETED} CPU usage: ${cpuUsage}%`);
            
            return ApiResponse(res, 200, 'CPU usage retrieved successfully', {
                cpuUsage,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.FAILED} Error getting CPU usage:`, error);
            return ApiResponse(res, 500, 'Failed to get CPU usage', { 
                error: 'CPU_USAGE_ERROR', 
                details: { message: error.message } 
            });
        }
    },

    /**
     * Get current memory usage
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} - Response object
     */
    getMemoryUsage: async (req, res) => {
        try {
            logger.info(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.PROCESSING} Memory usage request`);
            
            const memoryUsage = SystemMonitorService.getCurrentMemoryUsage();
            const freeMemoryMB = SystemMonitorService.getFreeMemoryMB();
            
            logger.info(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.COMPLETED} Memory usage: ${memoryUsage}%`);
            
            return ApiResponse(res, 200, 'Memory usage retrieved successfully', {
                memoryUsage,
                freeMemoryMB,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.FAILED} Error getting memory usage:`, error);
            return ApiResponse(res, 500, 'Failed to get memory usage', { 
                error: 'MEMORY_USAGE_ERROR', 
                details: { message: error.message } 
            });
        }
    },

    /**
     * Get optimal batch size
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} - Response object
     */
    getOptimalBatchSize: async (req, res) => {
        try {
            logger.info(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.PROCESSING} Optimal batch size request`);
            
            const batchSize = await SystemMonitorService.getOptimalBatchSize();
            
            logger.info(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.COMPLETED} Optimal batch size: ${batchSize}`);
            
            return ApiResponse(res, 200, 'Optimal batch size calculated successfully', {
                optimalBatchSize: batchSize,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.FAILED} Error calculating batch size:`, error);
            return ApiResponse(res, 500, 'Failed to calculate optimal batch size', { 
                error: 'BATCH_SIZE_ERROR', 
                details: { message: error.message } 
            });
        }
    },

    /**
     * Check if system can spawn more workers
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} - Response object
     */
    getWorkerCapacity: async (req, res) => {
        try {
            logger.info(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.PROCESSING} Worker capacity check request`);
            
            const canSpawnMore = await SystemMonitorService.canSpawnMoreWorkers();
            
            logger.info(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.COMPLETED} Can spawn more workers: ${canSpawnMore}`);
            
            return ApiResponse(res, 200, 'Worker capacity checked successfully', {
                canSpawnMoreWorkers: canSpawnMore,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.FAILED} Error checking worker capacity:`, error);
            return ApiResponse(res, 500, 'Failed to check worker capacity', { 
                error: 'WORKER_CAPACITY_ERROR', 
                details: { message: error.message } 
            });
        }
    },

    /**
     * Get comprehensive system snapshot
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} - Response object
     */
    getSystemSnapshot: async (req, res) => {
        try {
            logger.info(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.PROCESSING} System snapshot request`);
            
            const snapshot = await SystemMonitorService.getSystemSnapshot();
            
            logger.info(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.COMPLETED} System snapshot generated`);
            
            return ApiResponse(res, 200, 'System snapshot retrieved successfully', snapshot);
        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.FAILED} Error getting system snapshot:`, error);
            return ApiResponse(res, 500, 'Failed to get system snapshot', { 
                error: 'SYSTEM_SNAPSHOT_ERROR', 
                details: { message: error.message } 
            });
        }
    },

    /**
     * Reset system monitoring history
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @returns {Object} - Response object
     */
    resetMonitoring: async (req, res) => {
        try {
            logger.info(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.PROCESSING} Reset monitoring request`);
            
            SystemMonitorService.resetHistory();
            
            logger.info(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.COMPLETED} Monitoring history reset`);
            
            return ApiResponse(res, 200, 'System monitoring reset successfully', {
                reset: true,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error(`${ENTITY_PREFIXES.SYSTEM_MONITOR} ${LOG_ACTIONS.FAILED} Error resetting monitoring:`, error);
            return ApiResponse(res, 500, 'Failed to reset system monitoring', { 
                error: 'RESET_MONITORING_ERROR', 
                details: { message: error.message } 
            });
        }
    }
};

export { SystemMonitorController };

