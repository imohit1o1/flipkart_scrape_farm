import { getOptimalBatchSize, canSpawnMoreHeavyTasks, monitorResources } from './system_analytics.js';
import { RETRY_CONFIG, TASK_STATUS } from '../constants.js';

/**
 * Queue Manager
 *
 * Two-lane queue system with modes: "manual" and "bulk".
 * - manual: processed before bulk
 * - bulk: processed after manual
 *
 * Responsibilities:
 * - Enqueue jobs to manual/bulk
 * - Dispatch batches (manual first)
 * - Track in-flight jobs and lifecycle
 * - Auto-schedule downloads after successful requests
 * - Retry with backoff
 * - Provide metrics/snapshots for monitoring
 */
const QueueManager = (config = {}) => {
  // ===== STATE =====
  const manualQueue = [];      // Manual queue (processed before bulk)
  const bulkQueue = [];        // Bulk queue (processed after manual)
  const fileQueue = [];        // File operations queue

  const inFlightJobs = new Map();
  const scheduledDownloads = new Map();
  const jobDedupSet = new Set();
  const domainCooldowns = new Map();

  const settings = {
    maxBatchSize: config.maxBatchSize || 16,
    retryConfig: config.retryConfig || RETRY_CONFIG,
    cooldownMs: config.cooldownMs || 1000,
    defaultDownloadDelayMs: config.defaultDownloadDelayMs || 15 * 60 * 1000,
    resourceThresholds: config.resourceThresholds || {
      maxCPUsagePercent: 80,
      maxMemoryUsagePercent: 85,
      minFreeMemoryMB: 1024,
    },
    ...config,
  };

  const events = {
    onJobEnqueued: config.onJobEnqueued || (() => { }),
    onJobStarted: config.onJobStarted || (() => { }),
    onJobCompleted: config.onJobCompleted || (() => { }),
    onJobFailed: config.onJobFailed || (() => { }),
    onDownloadScheduled: config.onDownloadScheduled || (() => { }),
    onDrain: config.onDrain || (() => { }),
  };

  // ===== GUARDS & UTILS =====
  /**
   * Validates a job payload for enqueue.
   * @param {Object} job
   * @returns {boolean}
   */
  const validateJobForEnqueue = (job) => {
    const required = ['jobId', 'seller_id', 'identifier', 'reportType'];
    for (const field of required) {
      if (!job[field]) return false;
    }
    return true;
  };

  /**
   * Checks if a jobId already exists in queues or in-flight.
   * @param {string} jobId
   * @returns {boolean}
   */
  const isJobDuplicate = (jobId) => jobDedupSet.has(jobId) || inFlightJobs.has(jobId);

  /**
   * Finds a job across manual, bulk, and in-flight collections.
   * @param {string} jobId
   * @returns {Object|undefined}
   */
  const findJobById = (jobId) =>
    manualQueue.find(j => j.jobId === jobId) || bulkQueue.find(j => j.jobId === jobId) || inFlightJobs.get(jobId);

  /**
   * Removes a job from manual/bulk queues by id.
   * @param {string} jobId
   * @returns {boolean} true if removed
   */
  const removeJobFromQueues = (jobId) => {
    const manualIndex = manualQueue.findIndex(j => j.jobId === jobId);
    if (manualIndex !== -1) {
      manualQueue.splice(manualIndex, 1);
      return true;
    }
    const bulkIndex = bulkQueue.findIndex(j => j.jobId === jobId);
    if (bulkIndex !== -1) {
      bulkQueue.splice(bulkIndex, 1);
      return true;
    }
    return false;
  };

  /**
   * Builds a job key for identifying scheduled downloads.
   * @param {Object} job
   * @returns {string}
   */
  const getJobKey = (job) => `${job.seller_id}_${job.reportType}_${job.parameters?.startDate}_${job.parameters?.endDate}`;

  /**
   * Checks if a domain is currently under cooldown window.
   * @param {string} domain
   * @returns {boolean}
   */
  const isUnderCooldown = (domain) => {
    const lastRequest = domainCooldowns.get(domain);
    if (!lastRequest) return false;
    const timeSinceLastRequest = Date.now() - lastRequest;
    return timeSinceLastRequest < settings.cooldownMs;
  };

  /**
   * Checks resource limits using cpu_analytics.
   * @returns {Promise<boolean>}
   */
  const isUnderResourceLimits = async () => canSpawnMoreHeavyTasks(settings.resourceThresholds);

  /**
   * Gets current system state snapshot (resource status + sizing hints).
   * @returns {Promise<{canSpawnMore:boolean, optimalBatchSize:number, resourceStatus:Object}>}
   */
  const getSystemState = async () => ({
    canSpawnMore: await isUnderResourceLimits(),
    optimalBatchSize: await getOptimalBatchSize(),
    resourceStatus: await monitorResources(settings.resourceThresholds),
  });

  /**
   * Normalizes a job payload with default fields.
   * @param {Object} job
   * @returns {Object}
   */
  const enrichJobBase = (job) => ({
    ...job,
    attempts: job.attempts || 0,
    last_attempt_at: job.last_attempt_at || null,
    scheduled_for: job.scheduled_for || null,
    status: TASK_STATUS.ENQUEUED,
    enqueued_at: new Date(),
    // Clients do not provide operation; default to request. Downloads set internally later
    operation: 'request',
  });

  // ===== ENQUEUE =====
  /**
   * Enqueue a job to the manual queue.
   * @param {Object} job
   * @returns {Object} enriched job
   */
  const addManualJob = (job) => {
    if (!validateJobForEnqueue(job)) throw new Error('Invalid job for enqueue');
    if (isJobDuplicate(job.jobId)) throw new Error(`Job ${job.jobId} already exists`);
    const enrichedJob = enrichJobBase(job);
    enrichedJob.mode = 'manual';
    manualQueue.unshift(enrichedJob);
    jobDedupSet.add(enrichedJob.jobId);
    events.onJobEnqueued(enrichedJob);
    return enrichedJob;
  };

  /**
   * Enqueue a job to the bulk queue.
   * @param {Object} job
   * @returns {Object} enriched job
   */
  const addBulkJob = (job) => {
    if (!validateJobForEnqueue(job)) throw new Error('Invalid job for enqueue');
    if (isJobDuplicate(job.jobId)) throw new Error(`Job ${job.jobId} already exists`);
    const enrichedJob = enrichJobBase(job);
    enrichedJob.mode = 'bulk';
    bulkQueue.push(enrichedJob);
    jobDedupSet.add(enrichedJob.jobId);
    events.onJobEnqueued(enrichedJob);
    return enrichedJob;
  };

  /**
   * Backward-compat: Enqueue a job to bulk queue.
   * Prefer addManualJob/addBulkJob in routes.
   * @param {Object} job
   * @returns {Object}
   */
  const addJob = (job) => addBulkJob(job);

  /**
   * Backward-compat: Enqueue multiple jobs to bulk queue.
   * @param {Array<Object>} jobs
   * @returns {Array<Object|{error:string, job:Object}>>}
   */
  const addJobs = (jobs) => jobs.map(job => {
    try { return addBulkJob(job); } catch (error) { return { error: error.message, job }; }
  });

  /**
   * Enqueue a file task into the file queue.
   * @param {Object} fileTask
   * @returns {Object}
   */
  const addFileTask = (fileTask) => {
    const enrichedTask = {
      ...fileTask,
      id: fileTask.id || `file_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      status: 'pending',
    };
    fileQueue.push(enrichedTask);
    return enrichedTask;
  };

  // ===== MODE & ORDERING =====
  /**
   * Change a job's mode and move it to the appropriate queue.
   * @param {string} jobId
   * @param {('manual'|'bulk')} mode
   */
  const setMode = (jobId, mode) => {
    if (mode !== 'manual' && mode !== 'bulk') throw new Error('mode must be "manual" or "bulk"');
    const job = findJobById(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    job.mode = mode;
    removeJobFromQueues(jobId);
    if (mode === 'manual') manualQueue.unshift(job); else bulkQueue.push(job);
  };

  /**
   * Moves a job to the front of the manual queue and sets mode to manual.
   * @param {string} jobId
   */
  const bumpJob = (jobId) => {
    const job = findJobById(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    removeJobFromQueues(jobId);
    manualQueue.unshift(job);
    job.mode = 'manual';
  };

  // ===== SCHEDULING & DISPATCH =====
  /**
   * Checks if a job is eligible to run now (time/cooldown gates).
   * @param {Object} job
   * @returns {boolean}
   */
  const isEligibleToRun = (job) => {
    if (job.scheduled_for && new Date() < job.scheduled_for) return false;
    if (job.domain && isUnderCooldown(job.domain)) return false;
    return true;
  };

  /**
   * Dequeues up to optimal batch size (manual first, then bulk).
   * @returns {Promise<Array<Object>>}
   */
  const getNextBatch = async () => {
    await getSystemState();
    const optimalBatchSize = await getOptimalBatchSize();
    const actualBatchSize = Math.min(settings.maxBatchSize, optimalBatchSize);
    const batch = [];

    while (batch.length < actualBatchSize && manualQueue.length > 0) {
      const job = manualQueue[0];
      if (isEligibleToRun(job)) batch.push(manualQueue.shift());
      else manualQueue.push(manualQueue.shift());
    }
    while (batch.length < actualBatchSize && bulkQueue.length > 0) {
      const job = bulkQueue[0];
      if (isEligibleToRun(job)) batch.push(bulkQueue.shift());
      else bulkQueue.push(bulkQueue.shift());
    }
    return batch;
  };

  /**
   * Marks a batch of jobs as in-flight.
   * @param {Array<Object>} batch
   */
  const reserveBatch = (batch) => {
    for (const job of batch) {
      inFlightJobs.set(job.jobId, job);
      job.status = TASK_STATUS.IN_PROGRESS;
      job.started_at = new Date();
      events.onJobStarted(job);
    }
  };

  // ===== LIFECYCLE =====
  /**
   * Marks a job completed and schedules download if applicable.
   * @param {string} jobId
   * @param {Object} result
   * @returns {Object}
   */
  const markJobCompleted = (jobId, result) => {
    const job = inFlightJobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not in flight`);
    job.status = TASK_STATUS.COMPLETED;
    job.completed_at = new Date();
    job.result = result;
    inFlightJobs.delete(jobId);
    jobDedupSet.delete(jobId);
    events.onJobCompleted(job, result);
    if (job.operation === 'request') scheduleDownloadForSuccessfulRequest(job);
    return job;
  };

  /**
   * Whether a job should be retried based on attempts and policy.
   * @param {Object} job
   * @returns {boolean}
   */
  const shouldRetry = (job) => job.attempts < settings.retryConfig.MAX_RETRIES_ATTEMPTS;

  /**
   * Re-enqueues a failed job with backoff delay.
   * @param {Object} job
   */
  const requeueWithBackoff = (job) => {
    job.attempts++;
    job.last_attempt_at = new Date();
    const delayIndex = Math.min(job.attempts - 1, settings.retryConfig.RETRY_DELAYS_MS.length - 1);
    const delayMs = settings.retryConfig.RETRY_DELAYS_MS[delayIndex];
    job.scheduled_for = new Date(Date.now() + delayMs);
    job.status = TASK_STATUS.ENQUEUED;
    if (job.mode === 'manual') manualQueue.push(job); else bulkQueue.push(job);
  };

  /**
   * Marks a job as permanently failed (no further retries).
   * @param {Object} job
   */
  const markPermanentlyFailed = (job) => {
    job.status = TASK_STATUS.FAILED;
    jobDedupSet.delete(job.jobId);
  };

  /**
   * Marks a job failed and either retries or finalizes failure.
   * @param {string} jobId
   * @param {Error} error
   * @returns {Object}
   */
  const markJobFailed = (jobId, error) => {
    const job = inFlightJobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not in flight`);
    job.status = TASK_STATUS.FAILED;
    job.completed_at = new Date();
    job.error = error;
    inFlightJobs.delete(jobId);
    if (shouldRetry(job, error)) requeueWithBackoff(job); else markPermanentlyFailed(job);
    events.onJobFailed(job, error);
    return job;
  };

  /**
   * Shallow updates to an in-flight job's progress.
   * @param {string} jobId
   * @param {Object} patch
   * @returns {Object}
   */
  const updateJobProgress = (jobId, patch) => {
    const job = inFlightJobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not in flight`);
    Object.assign(job, patch);
    return job;
  };

  // ===== DOWNLOADS =====
  /**
   * Creates and enqueues a download job (mode 'bulk') for a completed request.
   * @param {Object} requestJob
   * @returns {Object} download job
   */
  const scheduleDownloadForSuccessfulRequest = (requestJob) => {
    const downloadJob = {
      ...requestJob,
      jobId: `${requestJob.jobId}_download`,
      operation: 'download',
      mode: 'bulk',
      scheduled_for: new Date(Date.now() + settings.defaultDownloadDelayMs),
      attempts: 0,
      last_attempt_at: null,
      status: TASK_STATUS.ENQUEUED,
    };
    bulkQueue.push(downloadJob);
    scheduledDownloads.set(getJobKey(requestJob), downloadJob.scheduled_for);
    events.onDownloadScheduled(downloadJob);
    return downloadJob;
  };

  /**
   * Dequeues all due downloads (scheduled time reached) from bulk queue.
   * @returns {Array<Object>} due download jobs
   */
  const enqueueDueDownloads = () => {
    const now = new Date();
    const dueDownloads = [];
    for (let i = 0; i < bulkQueue.length; i++) {
      const job = bulkQueue[i];
      if (job.operation === 'download' && job.scheduled_for && job.scheduled_for <= now) {
        dueDownloads.push(job);
        bulkQueue.splice(i, 1);
        i--;
      }
    }
    return dueDownloads;
  };

  // ===== FILE QUEUE =====
  /**
   * Pops up to n tasks from file queue.
   * @param {number} [n=8]
   * @returns {Array<Object>}
   */
  const getNextFileTasks = (n = 8) => {
    const tasks = [];
    for (let i = 0; i < Math.min(n, fileQueue.length); i++) tasks.push(fileQueue.shift());
    return tasks;
  };

  /**
   * Marks a file task completed (placeholder integration).
   * @param {string} taskId
   * @param {Object} result
   */
  const markFileTaskCompleted = (taskId, result) => {
    console.log(`File task ${taskId} completed:`, result);
  };

  /**
   * Marks a file task failed (placeholder integration).
   * @param {string} taskId
   * @param {Error} error
   */
  const markFileTaskFailed = (taskId, error) => {
    console.error(`File task ${taskId} failed:`, error);
  };

  // ===== METRICS =====
  /**
   * Returns queue sizes and counts.
   * @returns {{manualQueueLength:number, bulkQueueLength:number, fileQueueLength:number, inFlightCount:number, scheduledDownloadsCount:number, totalJobs:number}}
   */
  const getQueuesStatus = () => ({
    manualQueueLength: manualQueue.length,
    bulkQueueLength: bulkQueue.length,
    fileQueueLength: fileQueue.length,
    inFlightCount: inFlightJobs.size,
    scheduledDownloadsCount: scheduledDownloads.size,
    totalJobs: jobDedupSet.size,
  });

  /**
   * Preview next jobs in both queues (non-destructive).
   * @returns {Array<Object>} annotated preview entries
   */
  const getBatchPreview = () => {
    const preview = [];
    const maxPreview = 10;
    for (let i = 0; i < Math.min(maxPreview, manualQueue.length); i++) preview.push({ ...manualQueue[i], queue: 'manual', position: i });
    for (let i = 0; i < Math.min(maxPreview - preview.length, bulkQueue.length); i++) preview.push({ ...bulkQueue[i], queue: 'bulk', position: i });
    return preview;
  };

  /**
   * Combined metrics snapshot of queues and resource health.
   * @returns {Promise<Object>}
   */
  const getSystemSnapshot = async () => ({
    ...getQueuesStatus(),
    resourceStatus: await monitorResources(settings.resourceThresholds),
    timestamp: new Date(),
  });

  /**
   * Returns an array of jobs currently in-flight.
   * @returns {Array<Object>}
   */
  const getInFlightJobs = () => Array.from(inFlightJobs.values());

  /**
   * Returns pending jobs optionally filtered by mode/seller.
   * @param {{mode?:'manual'|'bulk', seller_id?:string}} [filters]
   * @returns {Array<Object>}
   */
  const getPendingJobs = (filters = {}) => {
    let jobs = [...manualQueue, ...bulkQueue];
    if (filters.mode) jobs = jobs.filter(job => job.mode === filters.mode);
    if (filters.seller_id) jobs = jobs.filter(job => job.seller_id === filters.seller_id);
    return jobs;
  };

  // ===== MAINTENANCE =====
  /**
   * Empties all queues (manual, bulk, file) and emits drain event.
   * @returns {{manual:Array<Object>, bulk:Array<Object>, file:Array<Object>}}
   */
  const drainAll = () => {
    const drained = {
      manual: manualQueue.splice(0),
      bulk: bulkQueue.splice(0),
      file: fileQueue.splice(0),
    };
    events.onDrain(drained);
    return drained;
  };

  /**
   * Placeholder: purge failed jobs matching filters (no-op).
   * @param {Object} [filters]
   */
  const purgeFailed = (filters = {}) => {
    console.log('Purging failed jobs with filters:', filters);
  };

  // ===== PUBLIC API =====
  return {
    // enqueue
    addManualJob,
    addBulkJob,
    addJob, // defaults to bulk; prefer addManualJob/addBulkJob in routes
    addJobs, // defaults to bulk
    addFileTask,
    // mode & ordering
    setMode,
    bumpJob,
    // scheduling
    getNextBatch,
    isEligibleToRun,
    reserveBatch,
    // lifecycle
    markJobCompleted,
    markJobFailed,
    updateJobProgress,
    // downloads
    scheduleDownloadForSuccessfulRequest,
    enqueueDueDownloads,
    // retry
    shouldRetry,
    requeueWithBackoff,
    markPermanentlyFailed,
    // file queue
    getNextFileTasks,
    markFileTaskCompleted,
    markFileTaskFailed,
    // metrics
    getQueuesStatus,
    getBatchPreview,
    getSystemSnapshot,
    getInFlightJobs,
    getPendingJobs,
    // maintenance
    drainAll,
    purgeFailed,
    // guards/utils
    validateJobForEnqueue,
    isJobDuplicate,
    isUnderResourceLimits,
    isUnderCooldown,
    findJobById,
    removeJobFromQueues,
    getJobKey,
    getSystemState,
    // state accessors
    settings,
  };
};

export { QueueManager }; 