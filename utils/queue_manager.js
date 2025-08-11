import { getOptimalBatchSize, canSpawnMoreHeavyTasks, monitorResources } from './cpu_analytics.js';
import { RETRY_CONFIG, TASK_STATUS } from '../constants.js';

const createQueueManager = (config = {}) => {
  // ===== STATE =====
  const manualQueue = [];      // High priority - single routes
  const bulkQueue = [];        // Lower priority - bulk operations
  const fileQueue = [];        // Medium priority - file operations

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
      maxCPUUsagePercent: 80,
      maxMemoryUsagePercent: 85,
      minFreeMemoryMB: 1024,
    },
    ...config,
  };

  const events = {
    onJobEnqueued: config.onJobEnqueued || (() => {}),
    onJobStarted: config.onJobStarted || (() => {}),
    onJobCompleted: config.onJobCompleted || (() => {}),
    onJobFailed: config.onJobFailed || (() => {}),
    onDownloadScheduled: config.onDownloadScheduled || (() => {}),
    onDrain: config.onDrain || (() => {}),
  };

  // ===== GUARDS & UTILS =====
  const validateJobForEnqueue = (job) => {
    const required = ['jobId', 'seller_id', 'identifier', 'reportType'];
    for (const field of required) {
      if (!job[field]) return false;
    }
    return true;
  };

  const isJobDuplicate = (jobId) => jobDedupSet.has(jobId) || inFlightJobs.has(jobId);

  const findJobById = (jobId) =>
    manualQueue.find(j => j.jobId === jobId) || bulkQueue.find(j => j.jobId === jobId) || inFlightJobs.get(jobId);

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

  const getJobKey = (job) => `${job.seller_id}_${job.reportType}_${job.parameters?.startDate}_${job.parameters?.endDate}`;

  const isUnderCooldown = (domain) => {
    const lastRequest = domainCooldowns.get(domain);
    if (!lastRequest) return false;
    const timeSinceLastRequest = Date.now() - lastRequest;
    return timeSinceLastRequest < settings.cooldownMs;
  };

  const isUnderResourceLimits = async () => canSpawnMoreHeavyTasks(settings.resourceThresholds);

  const getSystemState = async () => ({
    canSpawnMore: await isUnderResourceLimits(),
    optimalBatchSize: await getOptimalBatchSize(),
    resourceStatus: await monitorResources(settings.resourceThresholds),
  });

  // ===== ENQUEUE =====
  const addJob = (job) => {
    if (!validateJobForEnqueue(job)) throw new Error('Invalid job for enqueue');
    if (isJobDuplicate(job.jobId)) throw new Error(`Job ${job.jobId} already exists`);

    const enrichedJob = {
      ...job,
      attempts: job.attempts || 0,
      last_attempt_at: job.last_attempt_at || null,
      scheduled_for: job.scheduled_for || null,
      priority: job.priority || (job.mode === 'manual' ? 'high' : 'normal'),
      status: TASK_STATUS.ENQUEUED,
      enqueued_at: new Date(),
      operation: job.operation || 'request',
    };

    if (enrichedJob.mode === 'manual' || enrichedJob.priority === 'high') {
      manualQueue.unshift(enrichedJob);
    } else {
      bulkQueue.push(enrichedJob);
    }

    jobDedupSet.add(enrichedJob.jobId);
    events.onJobEnqueued(enrichedJob);
    return enrichedJob;
  };

  const addJobs = (jobs) => jobs.map(job => {
    try { return addJob(job); } catch (error) { return { error: error.message, job }; }
  });

  const addFileTask = (fileTask) => {
    const enrichedTask = {
      ...fileTask,
      id: fileTask.id || `file_${Date.now()}_${Math.random()}`,
      priority: fileTask.priority || 'normal',
      timestamp: Date.now(),
      status: 'pending',
    };
    fileQueue.push(enrichedTask);
    return enrichedTask;
  };

  // ===== PRIORITY & ORDERING =====
  const setPriority = (jobId, priority) => {
    const job = findJobById(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    job.priority = priority;
    if (priority === 'high' && job.mode !== 'manual') {
      removeJobFromQueues(jobId);
      manualQueue.unshift(job);
    }
  };

  const bumpJob = (jobId) => {
    const job = findJobById(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    removeJobFromQueues(jobId);
    manualQueue.unshift(job);
  };

  // ===== SCHEDULING & DISPATCH =====
  const isEligibleToRun = (job) => {
    if (job.scheduled_for && new Date() < job.scheduled_for) return false;
    if (job.domain && isUnderCooldown(job.domain)) return false;
    if (job.operation === 'request') return job.priority === 'high' || job.mode === 'manual' || job.mode === 'bulk';
    return true;
  };

  const getNextBatch = async () => {
    const systemState = await getSystemState();
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

  const reserveBatch = (batch) => {
    for (const job of batch) {
      inFlightJobs.set(job.jobId, job);
      job.status = TASK_STATUS.IN_PROGRESS;
      job.started_at = new Date();
      events.onJobStarted(job);
    }
  };

  // ===== LIFECYCLE =====
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

  const shouldRetry = (job) => job.attempts < settings.retryConfig.MAX_RETRIES_ATTEMPTS;

  const requeueWithBackoff = (job) => {
    job.attempts++;
    job.last_attempt_at = new Date();
    const delayIndex = Math.min(job.attempts - 1, settings.retryConfig.RETRY_DELAYS_MS.length - 1);
    const delayMs = settings.retryConfig.RETRY_DELAYS_MS[delayIndex];
    job.scheduled_for = new Date(Date.now() + delayMs);
    job.status = TASK_STATUS.ENQUEUED;
    if (job.mode === 'manual' || job.priority === 'high') manualQueue.push(job);
    else bulkQueue.push(job);
  };

  const markPermanentlyFailed = (job) => {
    job.status = TASK_STATUS.FAILED;
    jobDedupSet.delete(job.jobId);
  };

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

  const updateJobProgress = (jobId, patch) => {
    const job = inFlightJobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not in flight`);
    Object.assign(job, patch);
    return job;
  };

  // ===== DOWNLOADS =====
  const scheduleDownloadForSuccessfulRequest = (requestJob) => {
    const downloadJob = {
      ...requestJob,
      jobId: `${requestJob.jobId}_download`,
      operation: 'download',
      mode: 'auto',
      scheduled_for: new Date(Date.now() + settings.defaultDownloadDelayMs),
      attempts: 0,
      last_attempt_at: null,
      priority: 'high',
      status: TASK_STATUS.ENQUEUED,
    };
    bulkQueue.push(downloadJob);
    scheduledDownloads.set(getJobKey(requestJob), downloadJob.scheduled_for);
    events.onDownloadScheduled(downloadJob);
    return downloadJob;
  };

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
  const getNextFileTasks = (n = 8) => {
    const tasks = [];
    for (let i = 0; i < Math.min(n, fileQueue.length); i++) tasks.push(fileQueue.shift());
    return tasks;
  };

  const markFileTaskCompleted = (taskId, result) => {
    console.log(`File task ${taskId} completed:`, result);
  };

  const markFileTaskFailed = (taskId, error) => {
    console.error(`File task ${taskId} failed:`, error);
  };

  // ===== METRICS =====
  const getQueuesStatus = () => ({
    manualQueueLength: manualQueue.length,
    bulkQueueLength: bulkQueue.length,
    fileQueueLength: fileQueue.length,
    inFlightCount: inFlightJobs.size,
    scheduledDownloadsCount: scheduledDownloads.size,
    totalJobs: jobDedupSet.size,
  });

  const getBatchPreview = () => {
    const preview = [];
    const maxPreview = 10;
    for (let i = 0; i < Math.min(maxPreview, manualQueue.length); i++) preview.push({ ...manualQueue[i], queue: 'manual', position: i });
    for (let i = 0; i < Math.min(maxPreview - preview.length, bulkQueue.length); i++) preview.push({ ...bulkQueue[i], queue: 'bulk', position: i });
    return preview;
  };

  const getSystemSnapshot = async () => ({
    ...getQueuesStatus(),
    resourceStatus: await monitorResources(settings.resourceThresholds),
    timestamp: new Date(),
  });

  const getInFlightJobs = () => Array.from(inFlightJobs.values());

  const getPendingJobs = (filters = {}) => {
    let jobs = [...manualQueue, ...bulkQueue];
    if (filters.operation) jobs = jobs.filter(job => job.operation === filters.operation);
    if (filters.mode) jobs = jobs.filter(job => job.mode === filters.mode);
    if (filters.seller_id) jobs = jobs.filter(job => job.seller_id === filters.seller_id);
    return jobs;
  };

  // ===== MAINTENANCE =====
  const drainAll = () => {
    const drained = {
      manual: manualQueue.splice(0),
      bulk: bulkQueue.splice(0),
      file: fileQueue.splice(0),
    };
    events.onDrain(drained);
    return drained;
  };

  const purgeFailed = (filters = {}) => {
    console.log('Purging failed jobs with filters:', filters);
  };

  // ===== PUBLIC API =====
  return {
    // enqueue
    addJob,
    addJobs,
    addFileTask,
    // priority
    setPriority,
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
    // guards/utils (exposed for diagnostics/testing)
    validateJobForEnqueue,
    isJobDuplicate,
    isUnderResourceLimits,
    isUnderCooldown,
    findJobById,
    removeJobFromQueues,
    getJobKey,
    getSystemState,
    // state accessors (if needed later)
    settings,
  };
};

export { createQueueManager }; 