import os from 'os';
import { SYSTEM_RESOURCE_CONFIG } from '../constants.js';

const SystemMonitorService = {
    /**
     * Get real-time CPU usage percentage using system load
     * @returns {number} CPU usage percentage (0-100)
     */
    getCurrentCpuUsage: function () {
        const loadAvg = os.loadavg()[0]; // 1-minute load average
        const cpuCount = os.cpus().length;
        
        // Convert load average to percentage
        // Load of 1.0 = 100% on single core, so divide by core count
        const cpuUsage = Math.round((loadAvg / cpuCount) * 100);
        
        // Cap at 100%
        return Math.min(100, Math.max(0, cpuUsage));
    },

    /**
     * Get current memory usage percentage
     * @returns {number} Memory usage percentage (0-100)
     */
    getCurrentMemoryUsage: function () {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        return Math.round((usedMemory / totalMemory) * 100);
    },

    /**
     * Get free memory in MB
     * @returns {number} Free memory in MB
     */
    getFreeMemoryMB: function () {
        return Math.round(os.freemem() / (1024 * 1024));
    },

    /**
     * Calculate optimal batch size based on current CPU usage
     * @returns {number} Optimal batch size
     */
    getOptimalBatchSize: function () {
        const cpuUsage = this.getCurrentCpuUsage();
        const memoryUsage = this.getCurrentMemoryUsage();

        const { BATCH_THRESHOLDS, BATCH_SIZES } = SYSTEM_RESOURCE_CONFIG;

        // Use the higher constraint (CPU or Memory) to determine batch size
        const effectiveLoad = Math.max(cpuUsage, memoryUsage);

        if (effectiveLoad <= BATCH_THRESHOLDS.LOW_LOAD.CPU &&
            memoryUsage <= BATCH_THRESHOLDS.LOW_LOAD.MEMORY) {
            return BATCH_SIZES.MAXIMUM;
        } else if (effectiveLoad <= BATCH_THRESHOLDS.MEDIUM_LOAD.CPU &&
            memoryUsage <= BATCH_THRESHOLDS.MEDIUM_LOAD.MEMORY) {
            return BATCH_SIZES.STANDARD;
        } else if (effectiveLoad <= BATCH_THRESHOLDS.HIGH_LOAD.CPU &&
            memoryUsage <= BATCH_THRESHOLDS.HIGH_LOAD.MEMORY) {
            return BATCH_SIZES.REDUCED;
        } else {
            return BATCH_SIZES.MINIMUM;
        }
    },

    /**
     * Check if system can handle more file workers for background processing
     * @returns {Promise<boolean>} True if system can handle more file workers
     */
    canSpawnMoreWorkers: async function () {
        const cpuUsage = this.getCurrentCpuUsage();
        const memoryUsage = this.getCurrentMemoryUsage();
        const freeMemoryMB = this.getFreeMemoryMB();

        const { LIMITS } = SYSTEM_RESOURCE_CONFIG;

        return cpuUsage < LIMITS.MAX_CPU_USAGE_PERCENT &&
            memoryUsage < LIMITS.MAX_MEMORY_USAGE_PERCENT &&
            freeMemoryMB > 512; // Minimum 512MB free
    },

    /**
     * Get comprehensive system snapshot
     * @returns {Promise<Object>} Complete system metrics
     */
    getSystemSnapshot: function () {
        const cpuUsage = this.getCurrentCpuUsage();
        const memoryUsage = this.getCurrentMemoryUsage();
        const freeMemoryMB = this.getFreeMemoryMB();
        const optimalBatchSize = this.getOptimalBatchSize();
        const canSpawnMore = this.canSpawnMoreWorkers();

        return {
            timestamp: new Date().toISOString(),
            cpu: {
                current: cpuUsage
            },
            memory: {
                current: memoryUsage,
                freeMemoryMB,
                totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024))
            },
            system: {
                loadAverage: os.loadavg(),
                uptime: os.uptime(),
                platform: os.platform(),
                cpuCount: os.cpus().length
            },
            recommendations: {
                optimalBatchSize,
                canSpawnMoreWorkers: canSpawnMore,
                resourceStatus: this._getResourceStatus(cpuUsage, memoryUsage, freeMemoryMB)
            }
        };
    },

    /**
     * Get resource status classification
     * @param {number} cpuUsage 
     * @param {number} memoryUsage 
     * @param {number} freeMemoryMB 
     * @returns {string} Resource status
     */
    _getResourceStatus: function (cpuUsage, memoryUsage, freeMemoryMB) {
        const { LIMITS } = SYSTEM_RESOURCE_CONFIG;

        if (cpuUsage >= 90 || memoryUsage >= 90 || freeMemoryMB < 256) {
            return 'CRITICAL';
        } else if (cpuUsage >= LIMITS.MAX_CPU_USAGE_PERCENT ||
            memoryUsage >= LIMITS.MAX_MEMORY_USAGE_PERCENT ||
            freeMemoryMB < 512) {
            return 'HIGH';
        } else if (cpuUsage >= 60 || memoryUsage >= 70 || freeMemoryMB < 1024) {
            return 'MEDIUM';
        } else {
            return 'LOW';
        }
    },
};

export { SystemMonitorService };
